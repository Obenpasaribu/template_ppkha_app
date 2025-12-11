import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useForm } from "@inertiajs/react";
import * as React from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

// Daftar Program Studi Tetap
const PRODI_OPTIONS = [
    "S1-Informatika",
    "S1-Teknik Elektro",
    "S1-Sistem Informasi",
    "S1-Manajemen Rekayasa",
    "S1-Teknik Metalurgi",
    "S1-Teknik Bioproses",
    "D4-Teknologi Rekayasa Perangkat Lunak",
    "D3-Teknologi Informasi",
    "D3-Teknologi Komputer",
];

export function CreateSurveyDialog({ open, onOpenChange, soalOptions }) {
    // PERBAIKAN 1: Gunakan 'undefined' untuk nilai default select (Best practice Shadcn UI)
    const { data, setData, post, processing, errors, reset } = useForm({
        nama_penilai: "",
        nama_perusahaan: "",
        tingkat_perusahaan: undefined, // Ubah ke undefined
        nama_dinilai: "",
        nim_dinilai: "",
        foto_dinilai: null,
        prodi: undefined, // Ubah ke undefined
        tahun_lulus: "",
        jabatan_saat_ini: "",
        masa_kerja: "",
        id_soal: undefined, // PENTING: Ubah "" menjadi undefined
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // DEBUGGING: Cek apa yang sebenarnya dikirim ke Backend
        console.log("Data yang dikirim:", data);

        post(route("user-survey.store"), {
            onSuccess: () => {
                reset();
                onOpenChange(false);
                toast.success("Survey berhasil dibuat!");
            },
            onError: (err) => {
                // DEBUGGING: Lihat error apa yang dibalikan backend
                console.error("Error dari backend:", err);
                toast.error("Gagal membuat survey. Periksa inputan.");
            },
        });
    };

    // Pastikan modal mereset form saat ditutup/dibuka ulang (Opsional tapi disarankan)
    React.useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Buat Survey Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* BAGIAN 1: INFO PENILAI */}
                    <div className="text-sm font-bold text-gray-500 border-b pb-1 mb-2">
                        Informasi Penilai (Perusahaan)
                    </div>
                    {/* ... (Bagian Input Nama Penilai & Perusahaan SAMA, tidak perlu diubah) ... */}

                    {/* SAYA PERSINGKAT BAGIAN ATAS AGAR FOKUS KE PERBAIKAN SELECT */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nama_penilai">
                                Nama Penilai / Responden*
                            </Label>
                            <Input
                                id="nama_penilai"
                                value={data.nama_penilai}
                                onChange={(e) =>
                                    setData("nama_penilai", e.target.value)
                                }
                                placeholder="Contoh: Bpk. Manager"
                                required
                            />
                            {errors.nama_penilai && (
                                <span className="text-red-500 text-xs">
                                    {errors.nama_penilai}
                                </span>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nama_perusahaan">
                                Nama Perusahaan*
                            </Label>
                            <Input
                                id="nama_perusahaan"
                                value={data.nama_perusahaan}
                                onChange={(e) =>
                                    setData("nama_perusahaan", e.target.value)
                                }
                                placeholder="PT. Teknologi Maju"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Tingkat/Ukuran Perusahaan*</Label>
                            <Select
                                value={data.tingkat_perusahaan}
                                onValueChange={(val) =>
                                    setData("tingkat_perusahaan", val)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Tingkat" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Lokal">Lokal</SelectItem>
                                    <SelectItem value="Nasional">
                                        Nasional
                                    </SelectItem>
                                    <SelectItem value="Multinasional">
                                        Multinasional/Internasional
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.tingkat_perusahaan && (
                                <span className="text-red-500 text-xs">
                                    Wajib diisi
                                </span>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="jabatan">Jabatan Penilai</Label>
                            <Input
                                id="jabatan"
                                value={data.jabatan_saat_ini}
                                onChange={(e) =>
                                    setData("jabatan_saat_ini", e.target.value)
                                }
                                placeholder="HRD Manager"
                                required
                            />
                        </div>
                    </div>

                    {/* BAGIAN 2: INFO YANG DINILAI */}
                    <div className="text-sm font-bold text-gray-500 border-b pb-1 mb-2 mt-2">
                        Informasi Yang Dinilai (Alumni)
                    </div>

                    {/* ... (Bagian Input Foto, Nama, NIM tetap SAMA) ... */}
                    <div className="grid gap-2">
                        <Label htmlFor="foto_dinilai">
                            Foto Alumni (Opsional)
                        </Label>
                        <Input
                            id="foto_dinilai"
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) =>
                                setData("foto_dinilai", e.target.files[0])
                            }
                            className="cursor-pointer"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nama_dinilai">Nama Alumni*</Label>
                            <Input
                                id="nama_dinilai"
                                value={data.nama_dinilai}
                                onChange={(e) =>
                                    setData("nama_dinilai", e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nim_dinilai">NIM*</Label>
                            <Input
                                id="nim_dinilai"
                                value={data.nim_dinilai}
                                onChange={(e) =>
                                    setData("nim_dinilai", e.target.value)
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Prodi*</Label>
                        <Select
                            value={data.prodi}
                            onValueChange={(val) => setData("prodi", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Prodi" />
                            </SelectTrigger>
                            <SelectContent>
                                {PRODI_OPTIONS.map((prodi, idx) => (
                                    <SelectItem key={idx} value={prodi}>
                                        {prodi}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.prodi && (
                            <span className="text-red-500 text-xs">
                                Wajib pilih prodi
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Tahun Lulus</Label>
                            <Input
                                type="number"
                                value={data.tahun_lulus}
                                onChange={(e) =>
                                    setData("tahun_lulus", e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Masa Kerja</Label>
                            <Input
                                value={data.masa_kerja}
                                onChange={(e) =>
                                    setData("masa_kerja", e.target.value)
                                }
                                required
                            />
                        </div>
                    </div>

                    {/* --- PERBAIKAN UTAMA DI SINI --- */}
                    <div className="grid gap-2 mt-2">
                        <Label htmlFor="id_soal">Pilih Paket Soal*</Label>
                        <Select
                            value={data.id_soal}
                            onValueChange={(val) => {
                                console.log("Selected Soal ID:", val); // Debug saat memilih
                                setData("id_soal", val);
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Paket Soal Survey" />
                            </SelectTrigger>
                            <SelectContent>
                                {soalOptions && soalOptions.length > 0 ? (
                                    soalOptions.map((soal) => (
                                        <SelectItem
                                            key={soal.id_soal}
                                            value={String(soal.id_soal)} // Pastikan ini UUID string
                                        >
                                            {soal.judul_soal}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-gray-500">
                                        Tidak ada paket soal aktif
                                    </div>
                                )}
                            </SelectContent>
                        </Select>

                        {/* Menampilkan pesan error dari Backend */}
                        {errors.id_soal && (
                            <span className="text-red-500 text-xs">
                                {errors.id_soal}
                            </span>
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Memproses..." : "Buat & Generate"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
