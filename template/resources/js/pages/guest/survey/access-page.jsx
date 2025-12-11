import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GuestLayout from "@/layouts/guest-layout";
import { useForm, usePage } from "@inertiajs/react";
import * as React from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

export default function AccessPage() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        token: "",
    });

    // Menangani pesan error/sukses dari backend
    React.useEffect(() => {
        if (flash?.error) toast.error(flash.error);
        if (flash?.success) toast.success(flash.success);
    }, [flash]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("survey.check"));
    };

    return (
        <GuestLayout>
            <Card className="shadow-lg border-t-4 border-t-blue-600">
                <CardHeader>
                    <CardTitle>Masukkan Token Akses</CardTitle>
                    <CardDescription>
                        Silakan masukkan kode token unik yang telah diberikan
                        oleh Administrator untuk memulai pengisian survey.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="token">Token Survey</Label>
                            <Input
                                id="token"
                                placeholder="Tempel token di sini..."
                                value={data.token}
                                onChange={(e) =>
                                    setData("token", e.target.value)
                                }
                                className="text-center text-lg tracking-widest font-mono"
                                required
                            />
                            {errors.token && (
                                <p className="text-sm text-red-500">
                                    {errors.token}
                                </p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing ? "Memeriksa Token..." : "Mulai Survey"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
