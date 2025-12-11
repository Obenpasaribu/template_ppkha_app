import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Star } from "lucide-react"; // Menggunakan Lucide React

export function DetailSurveyDialog({ data, openDialog, setOpenDialog }) {
    if (!data) return null;

    // Parse jawaban jika masih dalam bentuk string JSON (jaga-jaga)
    let answers = [];
    try {
        answers =
            typeof data.jawaban_detail === "string"
                ? JSON.parse(data.jawaban_detail)
                : data.jawaban_detail || [];
    } catch (e) {
        answers = [];
    }

    const isFinished = data.status_survey === "sudah";

    return (
        <Sheet open={openDialog} onOpenChange={setOpenDialog}>
            {/* Perlebar Sheet agar muat banyak teks */}
            <SheetContent className="w-[400px] sm:w-[600px] flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Detail Jawaban Survey</SheetTitle>
                    <SheetDescription>
                        Berikut adalah detail penilaian yang diberikan oleh
                        responden.
                    </SheetDescription>
                </SheetHeader>

                <Separator className="my-4" />

                {/* === INFORMASI RESPONDEN (HEADER) === */}
                <div className="bg-muted/50 p-4 rounded-lg border space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">
                                PENILAI
                            </Label>
                            <div className="font-medium text-base">
                                {data.nama_penilai}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {data.jabatan_saat_ini}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">
                                PERUSAHAAN
                            </Label>
                            <div className="font-medium">
                                {data.nama_perusahaan}
                            </div>
                            {data.tingkat_perusahaan && (
                                <Badge
                                    variant="outline"
                                    className="mt-1 text-[10px] h-5 bg-white"
                                >
                                    {data.tingkat_perusahaan}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <Separator className="bg-border/60" />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">
                                ALUMNI DINILAI
                            </Label>
                            <div className="font-medium">
                                {data.nama_dinilai}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {data.nim_dinilai}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">
                                TOTAL SKOR
                            </Label>
                            <div className="text-2xl font-bold text-primary flex items-baseline gap-1">
                                {isFinished ? (
                                    <>
                                        {data.total_skor}
                                        <span className="text-sm text-muted-foreground font-normal">
                                            / {data.max_skor}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-lg text-muted-foreground">
                                        -
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* === LIST PERTANYAAN & JAWABAN (SCROLLABLE) === */}
                <div className="flex-1 overflow-hidden mt-2">
                    <Label className="mb-2 block font-bold">
                        Rincian Jawaban
                    </Label>
                    <ScrollArea className="h-full pr-4 -mr-4">
                        {!isFinished ? (
                            <div className="flex h-40 items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed text-sm">
                                Responden belum mengisi atau mensubmit survey
                                ini.
                            </div>
                        ) : (
                            <div className="space-y-6 pb-6">
                                {answers.map((item, index) => (
                                    <div
                                        key={index}
                                        className="space-y-2 border-b pb-4 last:border-0 border-border/50"
                                    >
                                        <div className="flex gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                                                {index + 1}
                                            </span>
                                            <div className="space-y-2 flex-1">
                                                <p className="text-sm font-medium leading-snug text-foreground">
                                                    {item.text}
                                                </p>

                                                {/* --- TAMPILAN JAWABAN --- */}
                                                {item.type === "skala" ? (
                                                    <div className="flex items-center gap-3 bg-yellow-50/50 p-2 rounded-md w-fit border border-yellow-100">
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map(
                                                                (_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        size={
                                                                            14
                                                                        }
                                                                        className={
                                                                            i <
                                                                            parseInt(
                                                                                item.value
                                                                            )
                                                                                ? "text-yellow-500 fill-yellow-500"
                                                                                : "text-gray-200 fill-gray-200"
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-bold text-yellow-700">
                                                            {item.value}{" "}
                                                            <span className="text-xs font-normal text-muted-foreground">
                                                                / 5
                                                            </span>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="mt-1 rounded-md bg-muted/50 p-3 text-sm text-foreground border border-border">
                                                        {item.value ? (
                                                            <span>
                                                                &quot;{item.value}&quot;
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">
                                                                - Tidak ada
                                                                jawaban -
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <SheetFooter className="mt-auto pt-4 border-t">
                    <SheetClose asChild>
                        <Button className="w-full sm:w-auto">Tutup</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
