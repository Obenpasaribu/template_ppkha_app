import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import GuestLayout from "@/layouts/guest-layout";
import { useForm } from "@inertiajs/react";
import {
    IconSend,
    IconUser,
    IconBuilding,
    IconInfoCircle,
} from "@tabler/icons-react";
import * as React from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

// PERBAIKAN 1: Tambahkan initialJawaban ke props
export default function FormPage({
    surveyData,
    soalList,
    id_soal,
    initialJawaban,
}) {
    // PERBAIKAN 2: Logic Inisialisasi Jawaban
    // Jika initialJawaban ada isinya (dari backend), pakai itu.
    // Jika kosong (survey baru), buat array objek kosong sesuai jumlah soal.
    const defaultAnswers = soalList.map((soal) => ({
        type: soal.type,
        value: null, // Default value kosong
    }));

    const finalInitialAnswers =
        initialJawaban && initialJawaban.length > 0
            ? initialJawaban
            : defaultAnswers;

    const { data, setData, post, processing, errors } = useForm({
        token: surveyData.token,
        soal_id: id_soal || surveyData.soal_id || surveyData.id_soal,
        // PERBAIKAN 3: Ubah nama key 'jawaban' jadi 'answers' agar konsisten dengan handleAnswerChange
        answers: finalInitialAnswers,
    });

    const handleAnswerChange = (index, value) => {
        // Karena kita pakai 'answers' di useForm, disini aksesnya data.answers (sudah benar)
        const newAnswers = [...data.answers];

        // Pastikan objek di index tersebut ada
        if (!newAnswers[index]) {
            newAnswers[index] = { type: "unknown", value: null };
        }

        newAnswers[index].value = value;
        setData("answers", newAnswers);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Cek validasi kelengkapan
        const incomplete = data.answers.some(
            (ans) => ans.value === "" || ans.value === null
        );

        if (incomplete) {
            toast.error("Mohon lengkapi semua pertanyaan sebelum mengirim.");
            return;
        }

        if (confirm("Apakah Anda yakin ingin mengirim jawaban?")) {
            post(route("survey.submit"), {
                onSuccess: () =>
                    toast.success(
                        "Terima kasih! Jawaban Anda telah tersimpan."
                    ),
                onError: () =>
                    toast.error("Terjadi kesalahan saat mengirim jawaban."),
            });
        }
    };

    return (
        <GuestLayout>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* --- CARD 1: DATA PENILAI --- */}
                <Card className="shadow-md border-t-4 border-t-blue-600">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <IconBuilding size={24} className="text-blue-600" />
                            Data Penilai (Perusahaan)
                        </CardTitle>
                        <div className="text-sm text-gray-600 mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                        NAMA PENILAI
                                    </p>
                                    <p className="font-semibold text-gray-900 text-lg mt-1">
                                        {surveyData.nama_penilai}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                        JABATAN
                                    </p>
                                    <p className="font-semibold text-gray-900 mt-1">
                                        {surveyData.jabatan_saat_ini}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                        PERUSAHAAN
                                    </p>
                                    <p className="font-semibold text-gray-900 mt-1">
                                        {surveyData.nama_perusahaan}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                        TINGKAT PERUSAHAAN
                                    </p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mt-1">
                                        {surveyData.tingkat_perusahaan}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* --- CARD 2: INFORMASI ALUMNI YANG DINILAI --- */}
                <Card className="shadow-md border-t-4 border-t-green-600">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <IconUser size={24} className="text-green-600" />
                            Informasi Alumni yang Dinilai
                        </CardTitle>
                        <div className="text-sm text-gray-600 mt-4 bg-green-50 p-6 rounded-lg border border-green-100">
                            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                                {/* FOTO ALUMNI */}
                                <div className="shrink-0">
                                    {surveyData.foto_dinilai ? (
                                        <img
                                            src={`/storage/${surveyData.foto_dinilai}`}
                                            alt="Foto Alumni"
                                            className="w-32 h-40 object-cover rounded-md border-2 border-white shadow-sm bg-gray-200"
                                        />
                                    ) : (
                                        <div className="w-32 h-40 bg-gray-200 rounded-md flex items-center justify-center border-2 border-white shadow-sm text-gray-400">
                                            <IconUser size={48} />
                                        </div>
                                    )}
                                </div>

                                {/* DATA TEKS */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                            NAMA ALUMNI
                                        </p>
                                        <p className="font-semibold text-gray-900 text-lg mt-1">
                                            {surveyData.nama_dinilai}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                            NIM
                                        </p>
                                        <p className="font-semibold text-gray-900 text-lg mt-1 font-mono">
                                            {surveyData.nim_dinilai}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                            PROGRAM STUDI
                                        </p>
                                        <p className="font-semibold text-gray-900 mt-1">
                                            {surveyData.prodi} (
                                            {surveyData.tahun_lulus})
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                            MASA KERJA
                                        </p>
                                        <p className="font-semibold text-gray-900 mt-1">
                                            {surveyData.masa_kerja}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* --- CARD 3: INSTRUKSI --- */}
                <Card className="shadow-md border-t-4 border-t-orange-500">
                    <CardHeader>
                        <CardTitle className="text-xl text-center leading-snug flex flex-col items-center gap-2">
                            <IconInfoCircle
                                size={32}
                                className="text-orange-500 mb-2"
                            />
                            <span>Survey Kepuasan Pengguna Alumni</span>
                            <span>Institut Teknologi Del Tahun 2024</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-700 leading-relaxed space-y-4 px-6 pb-8">
                        <p>
                            <strong>Bapak/ Ibu Yth.,</strong>
                        </p>
                        <p>Semoga dalam keadaan sehat dan bersukacita.</p>
                        <p className="text-justify">
                            Kami memohon kesediaan Bapak/ Ibu untuk dapat
                            mengisi survey kepuasan pengguna lulusan terhadap
                            alumni kami yang bekerja di perusahaan Bapak/ Ibu.
                            Survey ini bertujuan untuk memperoleh penilaian
                            perusahaan terhadap kompetensi dan sikap kerja dari
                            alumni.
                        </p>
                        {/* ... (Konten instruksi tetap sama) ... */}
                    </CardContent>
                </Card>

                {/* --- SOAL SURVEY --- */}
                <div className="space-y-4">
                    {soalList.map((soal, index) => (
                        <Card
                            key={index}
                            className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-blue-600"
                        >
                            <CardContent className="pt-6">
                                <div className="mb-4">
                                    <Label className="text-base font-medium flex gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold shrink-0">
                                            {index + 1}
                                        </span>
                                        <span className="leading-snug">
                                            {soal.text}
                                        </span>
                                    </Label>
                                </div>

                                {/* PERBAIKAN: Gunakan optional chaining (?.) untuk menghindari error jika data.answers[index] belum siap */}
                                {soal.type === "skala" ? (
                                    <div className="mt-4 pl-9">
                                        <RadioGroup
                                            onValueChange={(val) =>
                                                handleAnswerChange(index, val)
                                            }
                                            value={
                                                data.answers[index]?.value || ""
                                            }
                                            className="flex flex-col space-y-3"
                                        >
                                            {[1, 2, 3, 4, 5].map((score) => (
                                                <div
                                                    key={score}
                                                    className="flex items-center space-x-3 cursor-pointer p-1 rounded hover:bg-gray-50"
                                                >
                                                    <RadioGroupItem
                                                        value={String(score)}
                                                        id={`q${index}-${score}`}
                                                        className="text-blue-600 border-gray-400"
                                                    />
                                                    <Label
                                                        htmlFor={`q${index}-${score}`}
                                                        className="font-normal cursor-pointer flex items-center text-base"
                                                    >
                                                        <span className="font-bold mr-2 w-4">
                                                            {score}
                                                        </span>
                                                        {score === 1 && (
                                                            <span className="text-gray-500 text-sm ml-2">
                                                                - Sangat Tidak
                                                                Puas
                                                            </span>
                                                        )}
                                                        {score === 5 && (
                                                            <span className="text-gray-500 text-sm ml-2">
                                                                - Sangat Puas
                                                            </span>
                                                        )}
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                ) : (
                                    <div className="pl-9">
                                        <Textarea
                                            placeholder="Tuliskan jawaban Anda di sini..."
                                            className="mt-2 min-h-[100px] border-gray-300 focus:border-blue-500"
                                            value={
                                                data.answers[index]?.value || ""
                                            }
                                            onChange={(e) =>
                                                handleAnswerChange(
                                                    index,
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="sticky bottom-4 z-10 flex justify-end">
                    <Button
                        size="lg"
                        type="submit"
                        disabled={processing}
                        className="w-full sm:w-auto shadow-xl bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {processing ? (
                            "Mengirim..."
                        ) : (
                            <>
                                <IconSend className="mr-2" size={20} /> Kirim
                                Jawaban Survey
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
