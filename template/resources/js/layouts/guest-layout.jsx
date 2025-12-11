import { Toaster } from "sonner";

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                {/* Header / Logo Instansi */}
                <div className="mb-8 text-center">
                    {/* Pastikan file logo ada di public/img/logo/ atau sesuaikan src ini */}
                    <img
                        src="/img/logo/sdi-logo-dark.png"
                        alt="Logo"
                        className="h-16 mx-auto mb-4 object-contain"
                    />
                    <h1 className="text-2xl font-bold text-gray-800">
                        Survey Kepuasan Pengguna
                    </h1>
                    <p className="text-gray-500">Institut Teknologi Del</p>
                </div>

                {/* Konten Utama */}
                <main>{children}</main>

                <footer className="mt-8 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} PPKHA - Institut Teknologi
                    Del
                </footer>
            </div>
            {/* Komponen Notifikasi */}
            <Toaster richColors position="top-center" />
        </div>
    );
}
