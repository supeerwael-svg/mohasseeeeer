import type { PrintableSection } from '@/utils/printReport';
import type { WorkbookSheet } from '@/utils/spreadsheet';
import type { DailyReport, MonthlyReport } from '@/modules/absences/reportData';

export type Translate = (key: string, options?: Record<string, string | number>) => string;

export interface ReportTable extends PrintableSection {
  sheetName: string;
  emptyLabel: string;
}

function formatRate(rate: number | null): string {
  return rate === null ? '—' : `${rate.toFixed(2)}%`;
}

export function dailyReportTables(report: DailyReport, t: Translate): ReportTable[] {
  const absentBoarders = report.canteen.absentHalfBoarders;
  const tables: ReportTable[] = [
    {
      sheetName: t('reports.sheets.students'),
      heading: t('reports.daily.studentsSection'),
      emptyLabel: t('reports.daily.noAbsentStudents'),
      headers: [
        t('reports.columns.class'),
        t('reports.columns.student'),
        t('reports.columns.hours'),
        t('reports.columns.justified'),
        t('reports.columns.unjustified'),
      ],
      rows: report.classes.flatMap((section) =>
        section.students.map((line) => [
          section.className,
          line.name,
          String(line.hours),
          String(line.justifiedHours),
          String(line.unjustifiedHours),
        ]),
      ),
      footer: null,
    },
    {
      sheetName: t('reports.sheets.canteen'),
      heading: t('reports.daily.canteenSection'),
      emptyLabel: '',
      headers: [t('reports.columns.item'), t('reports.columns.count')],
      rows: [
        [t('reports.daily.canteenEnrolled'), String(report.canteen.halfBoarderCount)],
        [t('reports.daily.canteenAbsent'), String(absentBoarders.length)],
        [t('reports.daily.canteenExpected'), String(report.canteen.expectedCount)],
      ],
      footer: null,
    },
    {
      sheetName: t('reports.sheets.canteenList'),
      heading: t('reports.daily.canteenAbsentList'),
      emptyLabel: t('reports.daily.noAbsentBoarders'),
      headers: [t('reports.columns.student'), t('reports.columns.class')],
      rows: absentBoarders.map((line) => [line.name, line.className]),
      footer: null,
    },
  ];

  if (report.teachers) {
    tables.push({
      sheetName: t('reports.sheets.teachers'),
      heading: t('reports.daily.teachersSection'),
      emptyLabel: t('reports.daily.noAbsentTeachers'),
      headers: [
        t('reports.columns.teacher'),
        t('reports.columns.subject'),
        t('reports.columns.hours'),
        t('reports.columns.classes'),
      ],
      rows: report.teachers.map((line) => [
        line.name,
        line.subjects.join(', '),
        String(line.hours),
        line.classNames.join(', '),
      ]),
      footer: null,
    });
  }

  return tables;
}

export function monthlyReportTables(report: MonthlyReport, t: Translate): ReportTable[] {
  const movementHeaders = [t('reports.columns.student'), t('reports.columns.class'), t('reports.columns.date')];
  return [
    {
      sheetName: t('reports.sheets.rates'),
      heading: t('reports.monthly.rateSection'),
      emptyLabel: t('reports.monthly.noClasses'),
      headers: [
        t('reports.columns.class'),
        t('reports.columns.studentCount'),
        t('reports.columns.classHours'),
        t('reports.columns.requiredHours'),
        t('reports.columns.absentHours'),
        t('reports.columns.rate'),
      ],
      rows: report.rows.map((row) => {
        let rateCell = formatRate(row.rate);
        if (row.rate === null) {
          const hint = !row.hasTimetable
            ? t('reports.monthly.noTimetable')
            : row.studentCount === 0
              ? t('reports.monthly.noStudents')
              : t('reports.monthly.noRequiredHours');
          rateCell = `${formatRate(row.rate)} (${hint})`;
        }
        return [
          row.className,
          String(row.studentCount),
          String(row.classHours),
          String(row.requiredHours),
          String(row.hours),
          rateCell,
        ];
      }),
      footer: [
        t('reports.monthly.institutionTotal'),
        String(report.total.studentCount),
        String(report.total.classHours),
        String(report.total.requiredHours),
        String(report.total.hours),
        formatRate(report.total.rate),
      ],
    },
    {
      sheetName: t('reports.sheets.joined'),
      heading: t('reports.monthly.joinedSection'),
      emptyLabel: t('reports.monthly.noMovements'),
      headers: movementHeaders,
      rows: report.joined.map((line) => [line.name, line.className, line.date]),
      footer: null,
    },
    {
      sheetName: t('reports.sheets.left'),
      heading: t('reports.monthly.leftSection'),
      emptyLabel: t('reports.monthly.noMovements'),
      headers: movementHeaders,
      rows: report.left.map((line) => [line.name, line.className, line.date]),
      footer: null,
    },
  ];
}

export function toWorkbookSheets(tables: ReportTable[]): WorkbookSheet[] {
  return tables.map((table) => ({
    name: table.sheetName,
    headers: table.headers,
    rows: table.rows,
    footer: table.footer,
  }));
}
