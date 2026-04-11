-- ============================================
-- Atomicity hardening:
--   1. Stock RPCs (atomic inventory updates)
--   2. Payment-status trigger on payments
--   3. service_visits.lan_thu auto-number + unique constraint
--   4. Cascade FKs so deletes in the app don't need manual dependent cleanup
--
-- All statements are idempotent so the file can be re-applied safely.
-- ============================================

-- ============================================
-- 1. STOCK RPCs  (replaces the read-then-write pattern in the API layer)
-- ============================================
-- adjust_stock: add p_delta to the current tồn (negative = xuất, positive = nhập).
-- set_stock: set the tồn to an absolute value (kiểm kê).
-- Both clamp at 0 and return the new value.

CREATE OR REPLACE FUNCTION adjust_stock(
  p_loai TEXT,
  p_item_id UUID,
  p_delta NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_new NUMERIC;
BEGIN
  IF p_loai = 'chemicals' THEN
    UPDATE chemicals
       SET so_luong_ton = GREATEST(0, COALESCE(so_luong_ton, 0) + p_delta)
     WHERE id = p_item_id
    RETURNING so_luong_ton INTO v_new;
  ELSIF p_loai = 'supplies' THEN
    UPDATE supplies
       SET so_luong_ton = GREATEST(0, COALESCE(so_luong_ton, 0) + p_delta)
     WHERE id = p_item_id
    RETURNING so_luong_ton INTO v_new;
  ELSE
    RAISE EXCEPTION 'adjust_stock: invalid loai %, expected chemicals or supplies', p_loai;
  END IF;

  IF v_new IS NULL THEN
    RAISE EXCEPTION 'adjust_stock: % with id % not found', p_loai, p_item_id;
  END IF;
  RETURN v_new;
END;
$$;

CREATE OR REPLACE FUNCTION set_stock(
  p_loai TEXT,
  p_item_id UUID,
  p_value NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_new NUMERIC;
BEGIN
  IF p_loai = 'chemicals' THEN
    UPDATE chemicals
       SET so_luong_ton = GREATEST(0, p_value)
     WHERE id = p_item_id
    RETURNING so_luong_ton INTO v_new;
  ELSIF p_loai = 'supplies' THEN
    UPDATE supplies
       SET so_luong_ton = GREATEST(0, p_value)
     WHERE id = p_item_id
    RETURNING so_luong_ton INTO v_new;
  ELSE
    RAISE EXCEPTION 'set_stock: invalid loai %, expected chemicals or supplies', p_loai;
  END IF;

  IF v_new IS NULL THEN
    RAISE EXCEPTION 'set_stock: % with id % not found', p_loai, p_item_id;
  END IF;
  RETURN v_new;
END;
$$;

GRANT EXECUTE ON FUNCTION adjust_stock(TEXT, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION set_stock(TEXT, UUID, NUMERIC) TO authenticated;

-- ============================================
-- 2. PAYMENT-STATUS TRIGGER
-- ============================================
-- After any insert/update/delete on payments, recompute
-- contracts.so_tien_da_tra + contracts.trang_thai_thanh_toan
-- so concurrent writes always converge to the correct total.

CREATE OR REPLACE FUNCTION sync_contract_payment_status(p_contract_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_gia_tri NUMERIC;
  v_total NUMERIC;
  v_status TEXT;
BEGIN
  SELECT COALESCE(gia_tri, 0) INTO v_gia_tri
    FROM contracts
   WHERE id = p_contract_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(so_tien), 0) INTO v_total
    FROM payments
   WHERE contract_id = p_contract_id;

  IF v_gia_tri > 0 AND v_total >= v_gia_tri THEN
    v_status := 'Đã TT';
  ELSIF v_total > 0 THEN
    v_status := 'Đã cọc';
  ELSE
    v_status := 'Chưa TT';
  END IF;

  UPDATE contracts
     SET so_tien_da_tra = v_total,
         trang_thai_thanh_toan = v_status
   WHERE id = p_contract_id;
END;
$$;

CREATE OR REPLACE FUNCTION trg_payments_sync_contract_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_contract_payment_status(OLD.contract_id);
    RETURN OLD;
  END IF;

  PERFORM sync_contract_payment_status(NEW.contract_id);
  -- If the contract was reassigned, also re-sync the previous contract.
  IF TG_OP = 'UPDATE' AND OLD.contract_id IS DISTINCT FROM NEW.contract_id THEN
    PERFORM sync_contract_payment_status(OLD.contract_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_sync_contract ON payments;
CREATE TRIGGER trg_payments_sync_contract
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION trg_payments_sync_contract_fn();

-- Backfill any rows that drifted before the trigger existed.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM contracts LOOP
    PERFORM sync_contract_payment_status(r.id);
  END LOOP;
END$$;

-- ============================================
-- 3. service_visits.lan_thu AUTO-NUMBER + UNIQUE
-- ============================================
-- The API used to count rows then insert, which races under concurrency.
-- Now we set lan_thu in a BEFORE INSERT trigger (serialized by a row lock
-- on the parent contract) and enforce uniqueness at the DB level so any
-- remaining race fails loudly rather than silently corrupting data.

CREATE OR REPLACE FUNCTION trg_service_visits_autonum_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.lan_thu IS NULL OR NEW.lan_thu = 0 THEN
    -- Serialize lan_thu assignment per contract.
    PERFORM 1 FROM contracts WHERE id = NEW.contract_id FOR UPDATE;
    SELECT COALESCE(MAX(lan_thu), 0) + 1 INTO NEW.lan_thu
      FROM service_visits
     WHERE contract_id = NEW.contract_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sv_autonum ON service_visits;
CREATE TRIGGER trg_sv_autonum
BEFORE INSERT ON service_visits
FOR EACH ROW
EXECUTE FUNCTION trg_service_visits_autonum_fn();

-- Unique constraint — add only if no duplicates exist so the migration
-- doesn't fail on data that drifted before the trigger was in place.
DO $$
DECLARE
  v_dupes INT;
BEGIN
  SELECT COUNT(*) INTO v_dupes
    FROM (
      SELECT contract_id, lan_thu, COUNT(*) c
        FROM service_visits
       GROUP BY contract_id, lan_thu
      HAVING COUNT(*) > 1
    ) d;

  IF v_dupes = 0 THEN
    BEGIN
      ALTER TABLE service_visits
        ADD CONSTRAINT service_visits_contract_lan_unique UNIQUE (contract_id, lan_thu);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  ELSE
    RAISE NOTICE 'service_visits has % (contract_id, lan_thu) duplicates — clean up before adding UNIQUE constraint', v_dupes;
  END IF;
END$$;

-- ============================================
-- 4. CASCADE FKs  (so deleteCustomer / deleteContract stop doing manual loops)
-- ============================================

-- contracts.customer_id: RESTRICT -> CASCADE
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_customer_id_fkey;
ALTER TABLE contracts
  ADD CONSTRAINT contracts_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- service_history.contract_id: RESTRICT -> CASCADE
ALTER TABLE service_history DROP CONSTRAINT IF EXISTS service_history_contract_id_fkey;
ALTER TABLE service_history
  ADD CONSTRAINT service_history_contract_id_fkey
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

-- service_history.customer_id: NO ACTION -> CASCADE
ALTER TABLE service_history DROP CONSTRAINT IF EXISTS service_history_customer_id_fkey;
ALTER TABLE service_history
  ADD CONSTRAINT service_history_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- payments.contract_id: RESTRICT -> CASCADE
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_contract_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_contract_id_fkey
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

-- care_tasks.customer_id: RESTRICT -> CASCADE
ALTER TABLE care_tasks DROP CONSTRAINT IF EXISTS care_tasks_customer_id_fkey;
ALTER TABLE care_tasks
  ADD CONSTRAINT care_tasks_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- quotations.customer_id: RESTRICT -> CASCADE
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_customer_id_fkey;
ALTER TABLE quotations
  ADD CONSTRAINT quotations_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
