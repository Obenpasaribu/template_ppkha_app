<?php
namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use App\Models\UserSurveyModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * @codeCoverageIgnore
 */
class GuestSurveyController extends Controller
{
    // Halaman Input Token
    public function showAccessPage()
    {
        return Inertia::render('guest/survey/access-page');
    }

    // Cek Token dan Redirect ke Form
    public function checkToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        // Eloquent otomatis pakai nama tabel 't_user_survey' dari Model, jadi ini aman
        $survey = UserSurveyModel::where('token', $request->token)->first();

        if (! $survey) {
            return back()->withErrors(['token' => 'Token tidak valid.']);
        }

        if ($survey->status_survey === 'sudah') {
            return back()->withErrors(['token' => 'Survey ini sudah diisi sebelumnya.']);
        }

        // Jika valid, arahkan ke halaman pengisian
        return redirect()->route('survey.form', ['token' => $request->token]);
    }

    // Halaman Form Pengisian Survey
    public function showForm($token)
    {
        $survey = UserSurveyModel::with('soal')->where('token', $token)->firstOrFail();

        // Validasi lagi untuk keamanan (jika user copy paste URL history)
        if ($survey->status_survey === 'sudah') {
            return redirect()->route('survey.access')->withErrors(['token' => 'Survey sudah selesai.']);
        }

        return Inertia::render('guest/survey/form-page', [
            'surveyData' => $survey,
            'soalList' => $survey->soal->jenis_soal, // JSON Array pertanyaan
        ]);
    }

    // Simpan Jawaban
    public function submit(Request $request)
    {
        $request->validate([
            'token' => 'required|string|exists:t_user_survey,token',
            'answers' => 'required|array',
        ]);

        $survey = UserSurveyModel::where('token', $request->token)->firstOrFail();

        if ($survey->status_survey === 'sudah') {
            return back()->with('error', 'Survey sudah disubmit sebelumnya.');
        }

        // Hitung Total Skor (Hanya untuk tipe 'skala')
        $totalSkor = 0;
        foreach ($request->answers as $ans) {
            if (isset($ans['type']) && $ans['type'] === 'skala') {
                $totalSkor += (int) $ans['value'];
            }
        }

        $survey->update([
            'jawaban_detail' => $request->answers,
            'total_skor' => $totalSkor,
            'status_survey' => 'sudah', // Kunci survey agar token tidak bisa dipakai lagi
        ]);

        return redirect()->route('survey.access')->with('success', 'Terima kasih! Jawaban Anda telah tersimpan.');
    }
}
