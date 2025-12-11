<?php
namespace App\Http\Controllers\App\UserSurvey;

use App\Helper\ConstHelper;
use App\Http\Controllers\Controller;
use App\Models\SoalModel;
use App\Models\UserSurveyModel;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * @codeCoverageIgnore
 */
class UserSurveyController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search', '');
        $prodiFilter = $request->query('prodi', 'all'); // Tangkap filter prodi
        $page = $request->query('page', 1);
        $perPage = $request->query('perPage', 5);

        // --- STATISTIK DASHBOARD ---
        $allSurveys = UserSurveyModel::with('soal')
            ->where('status_survey', 'sudah')
            ->get();

        $statsProdi = [];
        $globalStats = ['Puas' => 0, 'Tidak Puas' => 0];

        foreach ($allSurveys as $survey) {
            $questions = (array) ($survey->soal->jenis_soal ?? []);

            $scaleCount = 0;
            foreach ($questions as $q) {
                if (($q['type'] ?? '') === 'skala') {
                    $scaleCount++;
                }
            }

            $maxScore = $scaleCount * 5;
            $score = $survey->total_skor;

            $isPuas = false;
            if ($maxScore > 0) {
                $percentage = ($score / $maxScore) * 100;
                $isPuas = $percentage >= 60;
            }

            if ($isPuas) {
                $globalStats['Puas']++;
            } else {
                $globalStats['Tidak Puas']++;
            }

            $prodiName = $survey->prodi ?? 'Lainnya';
            if (! isset($statsProdi[$prodiName])) {
                $statsProdi[$prodiName] = ['name' => $prodiName, 'Puas' => 0, 'Tidak Puas' => 0];
            }

            if ($isPuas) {
                $statsProdi[$prodiName]['Puas']++;
            } else {
                $statsProdi[$prodiName]['Tidak Puas']++;
            }
        }

        return Inertia::render('app/user-survey/user-survey-page', [
            'surveyList' => fn () => UserSurveyModel::with('soal')
                // 1. Filter Pencarian (Hanya Nama Penilai & Nama Alumni)
                ->when($search, function ($query) use ($search) {
                    $lower = strtolower($search);
                    $query->where(function ($q) use ($lower) {
                        $q->whereRaw('LOWER(nama_penilai) LIKE ?', ["%{$lower}%"])
                            ->orWhereRaw('LOWER(nama_dinilai) LIKE ?', ["%{$lower}%"]);
                    });
                })
                // 2. Filter Prodi (Dropdown)
                ->when($prodiFilter && $prodiFilter !== 'all', function ($query) use ($prodiFilter) {
                    $query->where('prodi', $prodiFilter);
                })
                ->orderByDesc('tanggal_dibuat')
                ->paginate($perPage)
                ->through(function ($survey) {
                    $questions = (array) ($survey->soal->jenis_soal ?? []);

                    $scaleCount = 0;
                    foreach ($questions as $q) {
                        if (($q['type'] ?? '') === 'skala') {
                            $scaleCount++;
                        }
                    }
                    $survey->max_skor = $scaleCount * 5;

                    return $survey;
                }),

            'soalOptions' => fn () => SoalModel::where('status_soal', 'sudah')
                ->select('id_soal', 'judul_soal')
                ->get(),

            'statistics' => [
                'barData' => array_values($statsProdi),
                'donutData' => [
                    ['name' => 'Puas', 'value' => $globalStats['Puas'], 'fill' => '#22c55e'],
                    ['name' => 'Tidak Puas', 'value' => $globalStats['Tidak Puas'], 'fill' => '#ef4444'],
                ],
            ],

            'pageName' => Inertia::always('User Survey'),
            'search' => Inertia::always($search),
            'prodiFilter' => Inertia::always($prodiFilter), // Kirim state filter ke frontend
            'page' => Inertia::always($page),
            'perPage' => Inertia::always($perPage),
            'perPageOptions' => Inertia::always(ConstHelper::OPTION_ROWS_PER_PAGE),
        ]);
    }

    // ... (Method store, destroy, export tetap sama, tidak perlu diubah)
    public function store(Request $request)
    {
        $request->validate([
            'nama_penilai' => 'required|string|max:255',
            'nama_perusahaan' => 'required|string|max:255',
            'tingkat_perusahaan' => 'required|string|max:255',
            'nama_dinilai' => 'required|string|max:255',
            'nim_dinilai' => 'required|string|max:50',
            'foto_dinilai' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'prodi' => 'required|string|max:255',
            'tahun_lulus' => 'required|string',
            'jabatan_saat_ini' => 'required|string',
            'masa_kerja' => 'required|string',
            'id_soal' => ['required', 'string', 'uuid', 'exists:m_soal,id_soal'],
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto_dinilai')) {
            $fotoPath = $request->file('foto_dinilai')->store('alumni-photos', 'public');
        }

        $token = hash('sha256', time().Str::random(10));
        $auth = $request->attributes->get('auth');

        UserSurveyModel::create([
            'nama_penilai' => $request->nama_penilai,
            'nama_perusahaan' => $request->nama_perusahaan,
            'tingkat_perusahaan' => $request->tingkat_perusahaan,
            'nama_dinilai' => $request->nama_dinilai,
            'nim_dinilai' => $request->nim_dinilai,
            'foto_dinilai' => $fotoPath,
            'dari' => $auth->name ?? 'Admin',
            'prodi' => $request->prodi,
            'tahun_lulus' => $request->tahun_lulus,
            'jabatan_saat_ini' => $request->jabatan_saat_ini,
            'masa_kerja' => $request->masa_kerja,
            'id_soal' => $request->id_soal,
            'token' => $token,
            'status_survey' => 'belum',
            'total_skor' => 0,
        ]);

        return back()->with('success', 'Survey berhasil dibuat.');
    }

    public function destroy(Request $request)
    {
        $request->validate(['ids' => 'required|array']);
        UserSurveyModel::whereIn('id_user_survey', $request->ids)->delete();

        return back()->with('success', 'Data survey berhasil dihapus.');
    }

    public function export()
    {
        $surveys = UserSurveyModel::with('soal')->orderByDesc('tanggal_dibuat')->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        // === VARIABLE COUNTER ===
        $rekapKesimpulan = [
            'Sangat Baik' => 0,
            'Baik' => 0,
            'Cukup' => 0,
            'Kurang Baik' => 0,
            'Belum' => 0,
        ];

        $statsPerPertanyaan = [];

        // --- I. HEADER TABEL UTAMA ---
        $fixedHeaders = [
            'No', 'Waktu Dibuat', 'Waktu Submit', 'Nama Penilai', 'Perusahaan', 'Tingkat Perusahaan',
            'Jabatan Penilai', 'Nama Alumni', 'NIM', 'Prodi', 'Tahun Lulus', 'Masa Kerja',
        ];

        $scaleHeaders = [
            'Etika dan Moral',
            'Keahlian dalam Bidang TI',
            'Kemampuan Bahasa Inggris',
            'Kemampuan Bekerja Sama',
            'Kemampuan Pengembangan Diri',
        ];

        $scoreHeaders = ['Total Skor', 'Kesimpulan Penilaian'];
        $textHeaders = ['Saran', 'Komentar'];

        $allHeaders = array_merge($fixedHeaders, $scaleHeaders, $scoreHeaders, $textHeaders);

        foreach ($allHeaders as $index => $header) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
            $sheet->setCellValue($columnLetter.'1', $header);

            $style = $sheet->getStyle($columnLetter.'1');
            $style->getFont()->setBold(true);
            $style->getAlignment()->setWrapText(true);
            $style->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // FIXED
            $style->getFill()->setFillType(Fill::FILL_SOLID);
            $style->getFill()->getStartColor()->setARGB('FFD9D9D9');

            $style->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        }

        // --- II. ISI DATA UTAMA ---
        $row = 2;

        foreach ($surveys as $index => $data) {
            $col = 1;

            // Helper untuk menulis cell tanpa error
            $write = function ($colIndex, $rowIndex, $value) use ($sheet) {
                $cell = Coordinate::stringFromColumnIndex($colIndex).$rowIndex;
                $sheet->setCellValue($cell, $value);
            };

            // Identitas
            $write($col++, $row, $index + 1);
            $write($col++, $row, $data->tanggal_dibuat ? $data->tanggal_dibuat->format('d-m-Y H:i') : '-');

            $waktuSubmit = ($data->status_survey == 'sudah' && $data->tanggal_diedit)
                ? $data->tanggal_diedit->format('d-m-Y H:i')
                : '-';

            $write($col++, $row, $waktuSubmit);

            $write($col++, $row, $data->nama_penilai);
            $write($col++, $row, $data->nama_perusahaan);
            $write($col++, $row, $data->tingkat_perusahaan);
            $write($col++, $row, $data->jabatan_saat_ini);
            $write($col++, $row, $data->nama_dinilai);
            $write($col++, $row, $data->nim_dinilai);
            $write($col++, $row, $data->prodi);
            $write($col++, $row, $data->tahun_lulus);
            $write($col++, $row, $data->masa_kerja);

            // Jawaban survey
            $jawaban = (array) ($data->jawaban_detail ?? []);

            $skalaAnswers = array_values(array_filter($jawaban, fn ($j) => ($j['type'] ?? '') === 'skala'));
            $textAnswers = array_values(array_filter($jawaban, fn ($j) => ($j['type'] ?? '') === 'teks'));

            // Kolom skala
            foreach ($scaleHeaders as $i => $header) {
                $val = isset($skalaAnswers[$i]) ? (int) $skalaAnswers[$i]['value'] : null;
                $write($col++, $row, $val ?? '-');

                if ($data->status_survey == 'sudah' && $val !== null) {

                    if (! isset($statsPerPertanyaan[$header])) {
                        $statsPerPertanyaan[$header] = [
                            'Sangat Baik' => 0,
                            'Baik' => 0,
                            'Cukup' => 0,
                            'Kurang Baik' => 0,
                        ];
                    }

                    if ($val == 5) {
                        $statsPerPertanyaan[$header]['Sangat Baik']++;
                    } elseif ($val == 4) {
                        $statsPerPertanyaan[$header]['Baik']++;
                    } elseif ($val == 3) {
                        $statsPerPertanyaan[$header]['Cukup']++;
                    } else {
                        $statsPerPertanyaan[$header]['Kurang Baik']++;
                    }
                }
            }

            // Total & kesimpulan
            $totalSkor = $data->total_skor;
            $kesimpulanText = '-';

            if ($data->status_survey == 'sudah') {
                if ($totalSkor <= 10) {
                    $kesimpulanText = 'Kurang Baik';
                    $rekapKesimpulan['Kurang Baik']++;
                } elseif ($totalSkor <= 15) {
                    $kesimpulanText = 'Cukup';
                    $rekapKesimpulan['Cukup']++;
                } elseif ($totalSkor <= 20) {
                    $kesimpulanText = 'Baik';
                    $rekapKesimpulan['Baik']++;
                } else {
                    $kesimpulanText = 'Sangat Baik';
                    $rekapKesimpulan['Sangat Baik']++;
                }
            } else {
                $kesimpulanText = 'Belum Mengisi';
                $rekapKesimpulan['Belum']++;
            }

            $write($col++, $row, $data->status_survey == 'sudah' ? $totalSkor : '-');
            $write($col++, $row, $kesimpulanText);

            // Text
            $write($col++, $row, $textAnswers[0]['value'] ?? '-');
            $write($col++, $row, $textAnswers[1]['value'] ?? '-');

            // Border baris
            $sheet->getStyle("A{$row}:".Coordinate::stringFromColumnIndex(count($allHeaders)).$row)
                ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

            $row++;
        }

        // AUTO SIZE
        $lastCol = Coordinate::stringFromColumnIndex(count($allHeaders));
        foreach (range('A', $lastCol) as $colID) {
            $sheet->getColumnDimension($colID)->setAutoSize(true);
        }

        // =============================
        // BAGIAN TABEL KESIMPULAN
        // =============================
        $start = $row + 3;

        // Tabel kiri
        $rowKiri = $start;

        $sheet->setCellValue("B{$rowKiri}", 'Tabel Kesimpulan Akhir');
        $sheet->mergeCells("B{$rowKiri}:C{$rowKiri}");

        $style = $sheet->getStyle("B{$rowKiri}");
        $style->getFont()->setBold(true)->setSize(12);
        $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $style->getFill()->setFillType(Fill::FILL_SOLID);
        $style->getFill()->getStartColor()->setARGB('FFD9D9D9');

        $sheet->getStyle("B{$rowKiri}:C{$rowKiri}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        $rowKiri++;

        $sheet->setCellValue("B{$rowKiri}", 'Kategori Penilaian');
        $sheet->setCellValue("C{$rowKiri}", 'Jumlah Responden');

        $sheet->getStyle("B{$rowKiri}:C{$rowKiri}")->getFont()->setBold(true);
        $sheet->getStyle("B{$rowKiri}:C{$rowKiri}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle("B{$rowKiri}:C{$rowKiri}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $rowKiri++;

        foreach (['Sangat Baik', 'Baik', 'Cukup', 'Kurang Baik'] as $label) {
            $sheet->setCellValue("B{$rowKiri}", $label);
            $sheet->setCellValue("C{$rowKiri}", $rekapKesimpulan[$label].' Orang');
            $sheet->getStyle("B{$rowKiri}:C{$rowKiri}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle("C{$rowKiri}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $rowKiri++;
        }

        $total = array_sum($rekapKesimpulan) - $rekapKesimpulan['Belum'];

        $sheet->setCellValue("B{$rowKiri}", 'Total');
        $sheet->setCellValue("C{$rowKiri}", $total.' Orang');
        $sheet->getStyle("B{$rowKiri}:C{$rowKiri}")->getFont()->setBold(true);
        $sheet->getStyle("B{$rowKiri}:C{$rowKiri}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle("C{$rowKiri}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // ============================
        // Tabel kanan per pertanyaan
        // ============================
        $rowKanan = $start;

        $sheet->setCellValue("E{$rowKanan}", 'Kesimpulan Penilaian Per Aspek');
        $sheet->mergeCells("E{$rowKanan}:I{$rowKanan}");

        $style = $sheet->getStyle("E{$rowKanan}");
        $style->getFont()->setBold(true)->setSize(12);
        $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $style->getFill()->setFillType(Fill::FILL_SOLID);
        $style->getFill()->getStartColor()->setARGB('FFD9D9D9');

        $sheet->getStyle("E{$rowKanan}:I{$rowKanan}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        $rowKanan++;

        $headers = ['Penilaian (Aspek)', 'Sangat Baik (5)', 'Baik (4)', 'Cukup (3)', 'Kurang Baik (<=2)'];
        $col = 'E';

        foreach ($headers as $h) {
            $sheet->setCellValue("{$col}{$rowKanan}", $h);
            $sheet->getStyle("{$col}{$rowKanan}")->getFont()->setBold(true);
            $sheet->getStyle("{$col}{$rowKanan}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle("{$col}{$rowKanan}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getColumnDimension($col)->setAutoSize(true);
            $col++;
        }

        $rowKanan++;

        foreach ($scaleHeaders as $aspek) {
            $stats = $statsPerPertanyaan[$aspek] ?? [
                'Sangat Baik' => 0, 'Baik' => 0, 'Cukup' => 0, 'Kurang Baik' => 0,
            ];

            $sheet->setCellValue("E{$rowKanan}", $aspek);
            $sheet->setCellValue("F{$rowKanan}", $stats['Sangat Baik'].' Orang');
            $sheet->setCellValue("G{$rowKanan}", $stats['Baik'].' Orang');
            $sheet->setCellValue("H{$rowKanan}", $stats['Cukup'].' Orang');
            $sheet->setCellValue("I{$rowKanan}", $stats['Kurang Baik'].' Orang');

            $sheet->getStyle("E{$rowKanan}:I{$rowKanan}")
                ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

            $sheet->getStyle("F{$rowKanan}:I{$rowKanan}")
                ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $rowKanan++;
        }

        // Footer kanan
        $sheet->setCellValue("E{$rowKanan}", 'Total');
        $sheet->setCellValue("F{$rowKanan}", array_sum(array_column($statsPerPertanyaan, 'Sangat Baik')).' Orang');
        $sheet->setCellValue("G{$rowKanan}", array_sum(array_column($statsPerPertanyaan, 'Baik')).' Orang');
        $sheet->setCellValue("H{$rowKanan}", array_sum(array_column($statsPerPertanyaan, 'Cukup')).' Orang');
        $sheet->setCellValue("I{$rowKanan}", array_sum(array_column($statsPerPertanyaan, 'Kurang Baik')).' Orang');

        $sheet->getStyle("E{$rowKanan}:I{$rowKanan}")->getFont()->setBold(true);
        $sheet->getStyle("E{$rowKanan}:I{$rowKanan}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle("F{$rowKanan}:I{$rowKanan}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // RETURN FILE
        $writer = new Xlsx($spreadsheet);
        $fileName = 'Laporan_Survey_Lengkap_'.date('Y-m-d_His').'.xlsx';

        $response = new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        });

        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment;filename="'.$fileName.'"');
        $response->headers->set('Cache-Control', 'max-age=0');

        return $response;
    }
}
