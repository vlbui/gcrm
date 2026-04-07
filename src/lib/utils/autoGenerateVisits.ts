import { autoGenerateVisits } from "@/lib/api/serviceVisits.api";
import { createReminder } from "@/lib/api/reminders.api";

/**
 * Called after creating a periodic contract.
 * Generates N service visits and reminders 3 days before each.
 */
export async function generateVisitsAndReminders(
  contractId: string,
  customerId: string,
  soLan: number,
  ngayBatDau: string,
  tanSuat: string
): Promise<void> {
  // Generate visits
  await autoGenerateVisits(contractId, soLan, ngayBatDau, tanSuat);

  // Generate reminders 3 days before each visit
  const start = new Date(ngayBatDau);
  for (let i = 0; i < soLan; i++) {
    const visitDate = new Date(start);
    if (tanSuat === "1 tháng") visitDate.setMonth(visitDate.getMonth() + i);
    else if (tanSuat === "2 tháng") visitDate.setMonth(visitDate.getMonth() + i * 2);
    else if (tanSuat === "3 tháng") visitDate.setMonth(visitDate.getMonth() + i * 3);
    else if (tanSuat === "6 tháng") visitDate.setMonth(visitDate.getMonth() + i * 6);
    else if (tanSuat === "Năm") visitDate.setFullYear(visitDate.getFullYear() + i);
    else visitDate.setMonth(visitDate.getMonth() + i);

    const reminderDate = new Date(visitDate);
    reminderDate.setDate(reminderDate.getDate() - 3);

    await createReminder({
      customer_id: customerId,
      contract_id: contractId,
      loai: "Lần DV tiếp theo",
      ngay_nhac: reminderDate.toISOString().split("T")[0],
      noi_dung: `Lần DV ${i + 1} dự kiến ngày ${visitDate.toISOString().split("T")[0]}`,
    });
  }
}
