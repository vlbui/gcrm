"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchCmsTable,
  createCmsRecord,
  updateCmsRecord,
  type CmsCompanyInfo,
} from "@/lib/api/cms.api";

interface FieldConfig {
  key: string;
  label: string;
  type: "input" | "textarea";
  placeholder?: string;
}

const FIELDS: FieldConfig[] = [
  { key: "company_name", label: "Tên công ty", type: "input", placeholder: "Nhập tên công ty" },
  { key: "slogan", label: "Slogan", type: "input", placeholder: "Nhập slogan" },
  { key: "phone", label: "Số điện thoại", type: "input", placeholder: "Nhập số điện thoại" },
  { key: "email", label: "Email", type: "input", placeholder: "Nhập email" },
  { key: "address", label: "Địa chỉ", type: "textarea", placeholder: "Nhập địa chỉ" },
  { key: "tax_id", label: "Mã số thuế", type: "input", placeholder: "Nhập mã số thuế" },
  { key: "working_hours", label: "Giờ làm việc", type: "input", placeholder: "VD: 8:00 - 17:00, Thứ 2 - Thứ 7" },
  { key: "facebook", label: "Facebook", type: "input", placeholder: "Nhập link Facebook" },
  { key: "zalo", label: "Zalo", type: "input", placeholder: "Nhập số Zalo hoặc link" },
  { key: "google_maps", label: "Google Maps", type: "textarea", placeholder: "Nhập link hoặc embed Google Maps" },
];

export default function CompanyInfoPage() {
  const [records, setRecords] = useState<CmsCompanyInfo[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const result = await fetchCmsTable<CmsCompanyInfo>("cms_company_info");
      setRecords(result);
      const map: Record<string, string> = {};
      result.forEach((item) => {
        map[item.key] = item.value;
      });
      // Initialize all fields
      FIELDS.forEach((f) => {
        if (!(f.key in map)) {
          map[f.key] = "";
        }
      });
      setValues(map);
    } catch {
      toast.error("Không thể tải thông tin công ty");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const field of FIELDS) {
        const currentValue = values[field.key] ?? "";
        const existing = records.find((r) => r.key === field.key);

        if (existing) {
          if (existing.value !== currentValue) {
            await updateCmsRecord("cms_company_info", existing.id, {
              value: currentValue,
            });
          }
        } else {
          if (currentValue) {
            await createCmsRecord("cms_company_info", {
              key: field.key,
              value: currentValue,
            });
          }
        }
      }
      toast.success("Lưu thông tin công ty thành công");
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Thông tin Công ty</h1>
        </div>
      </div>

      <div className="data-table-wrapper">
        {loading ? (
          <div className="empty-state">
            <p>Đang tải...</p>
          </div>
        ) : (
          <>
            <div className="form-grid" style={{ padding: "1.5rem" }}>
              {FIELDS.map((field) => (
                <div
                  key={field.key}
                  className={`form-field ${
                    field.type === "textarea" ? "full-width" : ""
                  }`}
                >
                  <Label>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={values[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={values[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="form-actions" style={{ padding: "0 1.5rem 1.5rem" }}>
              <Button onClick={handleSave} disabled={saving}>
                <Save size={16} />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
