import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "@inertiajs/react";
import { Separator } from "@/components/ui/separator";
import { AlertCircleIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

export function DeleteSurveyDialog({ dataDelete, openDialog, setOpenDialog }) {
    const { data, setData, post, processing, reset } = useForm({
        ids: [],
        confirmation: "",
    });

    const [keyConfirmation, setKeyConfirmation] = useState("");

    // Generate Kunci Random saat dialog dibuka
    useEffect(() => {
        if (openDialog && dataDelete && dataDelete.ids) {
            const randomKey = Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

            setKeyConfirmation(randomKey);
            setData("ids", dataDelete.ids);
            setData("confirmation", "");
        }
    }, [openDialog, dataDelete]);

    const handleSubmit = () => {
        if (data.confirmation !== keyConfirmation) {
            toast.error("Kunci konfirmasi tidak sesuai.");
            return;
        }

        post(route("user-survey.delete"), {
            onSuccess: () => {
                setOpenDialog(false);
                reset();
            },
            onError: () => {
                toast.error("Gagal menghapus data.");
            },
        });
    };

    return (
        <Sheet open={openDialog} onOpenChange={setOpenDialog}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-red-600">
                        <Trash2Icon className="h-5 w-5" />
                        Hapus Survey
                    </SheetTitle>
                    <SheetDescription>
                        Tindakan ini tidak dapat dibatalkan. Data survey yang
                        dihapus akan hilang permanen.
                    </SheetDescription>
                </SheetHeader>

                <Separator className="my-6" />

                <div className="grid gap-6">
                    {/* Peringatan Data yang Dihapus */}
                    <Alert
                        variant="destructive"
                        className="bg-red-50 border-red-200 text-red-800"
                    >
                        <AlertCircleIcon className="h-4 w-4" />
                        <AlertTitle className="font-bold ml-2">
                            Peringatan
                        </AlertTitle>
                        <AlertDescription className="mt-2 ml-2">
                            <p className="mb-2">
                                Dengan menghapus survey, data ini tidak lagi
                                dapat diakses untuk pelaporan. Daftar penilai
                                yang akan dihapus:
                            </p>
                            <ul className="list-disc list-outside pl-4 text-xs font-medium space-y-1">
                                {dataDelete?.dataList?.map((item, idx) => (
                                    <li key={idx}>
                                        <span className="font-bold">
                                            {item.name}
                                        </span>
                                        <span className="text-red-600/80">
                                            {" "}
                                            — {item.company}
                                        </span>
                                    </li>
                                ))}
                                {dataDelete?.dataList?.length > 5 && (
                                    <li className="list-none pt-1 italic">
                                        ...dan {dataDelete.dataList.length - 5}{" "}
                                        data lainnya.
                                    </li>
                                )}
                            </ul>
                        </AlertDescription>
                    </Alert>

                    {/* Bagian Konfirmasi Kunci */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                                Kunci Konfirmasi
                            </Label>
                            <div
                                className="text-3xl font-mono font-black text-center tracking-[0.5em] text-slate-700 bg-white py-3 border rounded-md select-all cursor-copy hover:bg-slate-50 transition-colors"
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        keyConfirmation
                                    );
                                    toast.info("Kunci disalin ke clipboard");
                                }}
                                title="Klik untuk menyalin"
                            >
                                {keyConfirmation}
                            </div>
                            <p className="text-[10px] text-gray-400 text-center">
                                Ketik ulang kode di atas untuk melanjutkan
                                penghapusan.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="confirmation"
                                className="text-xs text-gray-500 uppercase tracking-wider font-bold"
                            >
                                Masukkan Kunci
                            </Label>
                            <Input
                                id="confirmation"
                                placeholder="KETIK KUNCI DI SINI"
                                value={data.confirmation}
                                onChange={(e) =>
                                    setData(
                                        "confirmation",
                                        e.target.value.toUpperCase()
                                    )
                                }
                                className={`text-center font-mono text-lg tracking-widest uppercase transition-all duration-200 ${
                                    data.confirmation === keyConfirmation
                                        ? "border-green-500 focus-visible:ring-green-500 bg-green-50 text-green-700"
                                        : "focus-visible:ring-red-500"
                                }`}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer dengan Tombol Sama Panjang (Grid) */}
                <SheetFooter className="mt-8 grid grid-cols-2 gap-3">
                    <SheetClose asChild>
                        <Button variant="outline" className="w-full">
                            Batal
                        </Button>
                    </SheetClose>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={
                            processing || data.confirmation !== keyConfirmation
                        }
                        className="w-full bg-red-600 hover:bg-red-700 transition-all"
                    >
                        {processing ? "Menghapus..." : "Ya, Hapus Permanen"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
