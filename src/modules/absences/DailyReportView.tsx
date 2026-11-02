import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormError } from '@/components/ui/StatusBlock';
import type { AbsenceWorkspace } from '@/db/absences';
import { buildDailyReport } from '@/modules/absences/reportData';
import { ReportExportBar, ReportTableView } from '@/modules/absences/ReportTableView';
import { dailyReportTables, toWorkbookSheets } from '@/modules/absences/reportTables';
import { formatIsoDate, todayIso } from '@/utils/dates';
import { isIsoDate } from '@/utils/absences';
import { exportSheetsToExcel } from '@/utils/spreadsheet';
import { printReport } from '@/utils/printReport';

interface DailyReportViewProps {
  data: AbsenceWorkspace;
}

export function DailyReportView({ data }: DailyReportViewProps) {
  const { t, i18n } = useTranslation();
  const [date, setDate] = useState(todayIso);
  const validDate = isIsoDate(date);
  const report = useMemo(() => (validDate ? buildDailyReport(data, date) : null), [data, date, validDate]);
  const tables = report ? dailyReportTables(report, t) : [];

  const handlePrint = () => {
    printReport({
      title: t('reports.daily.title'),
      subtitle: t('reports.daily.subtitle', { date: formatIsoDate(date, i18n.language) }),
      lang: i18n.language,
      dir: i18n.dir(),
      sections: tables,
    });
  };

  const handleExcel = () => {
    exportSheetsToExcel(toWorkbookSheets(tables), `daily-absence-report-${date}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700 sm:max-w-xs">
        {t('absences.date')}
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3 text-base text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </label>

      {!validDate ? <FormError message={t('validation.invalidDate')} /> : null}

      {report ? (
        <>
          {!report.schoolDay ? (
            <p className="rounded-xl bg-warning-50 p-4 text-sm text-warning-700">{t('reports.notSchoolDay')}</p>
          ) : null}
          <ReportExportBar onPrint={handlePrint} onExcel={handleExcel} />
          {tables.map((table) => (
            <ReportTableView key={table.sheetName} table={table} />
          ))}
        </>
      ) : null}
    </div>
  );
}
