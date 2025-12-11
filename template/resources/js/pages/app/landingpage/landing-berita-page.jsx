import React, { useState } from "react";
import { router } from "@inertiajs/react";
import LandingLayout from "@/layouts/landing-layout";
import Pagination from "@/components/pagination";
import {
    IconSearch,
    IconCalendar,
    IconUser,
    IconNews,
    IconChevronRight,
} from "@tabler/icons-react";

// Helper untuk format tanggal Indonesia
// GANTI fungsi formatDate dengan ini:
const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

// Helper untuk memotong teks (excerpt)
const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    // Strip HTML tags jika ada (karena isi berita mungkin HTML dari Rich Text Editor)
    const strippedText = text.replace(/(<([^>]+)>)/gi, "");
    if (strippedText.length <= maxLength) return strippedText;
    return strippedText.substr(0, maxLength) + "...";
};

export default function LandingBeritaPage({ auth, contentData, state }) {
    const [searchTerm, setSearchTerm] = useState(state.search || "");

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("landing.berita"),
            { search: searchTerm },
            { preserveState: true, preserveScroll: true }
        );
    };

    return (
        <LandingLayout
            auth={auth}
            activeMenu="berita"
            title="Berita & Pengumuman - Career Center IT Del"
        >
            {/* --- HERO SECTION / HEADER --- */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 mb-8 text-white relative overflow-hidden">
                {/* Background Pattern (Optional Decoration) */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <svg
                        className="h-full w-full"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        Berita & Artikel
                    </h1>
                    <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
                        Dapatkan informasi terbaru seputar karir, lowongan
                        kerja, beasiswa, dan kegiatan alumni IT Del.
                    </p>

                    {/* SEARCH BAR */}
                    <form
                        onSubmit={handleSearch}
                        className="max-w-xl mx-auto relative"
                    >
                        <div className="relative flex items-center">
                            <IconSearch className="absolute left-4 text-gray-400 w-5 h-5 z-10" />
                            <input
                                type="text"
                                placeholder="Cari berita, event, atau artikel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-full border-none shadow-lg text-gray-800 focus:ring-4 focus:ring-blue-400/50 outline-none transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition shadow-md"
                            >
                                Cari
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- LIST CONTENT --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
                {/* Judul Section Kecil */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <IconNews className="text-blue-600" /> Berita Terbaru
                    </h2>
                    {state.search && (
                        <p className="text-sm text-gray-500">
                            Menampilkan hasil pencarian untuk:{" "}
                            <span className="font-semibold text-gray-800">
                                "{state.search}"
                            </span>
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {contentData.data.length > 0 ? (
                        contentData.data.map((item) => (
                            <article
                                key={item.id_berita}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full group overflow-hidden"
                            >
                                {/* GAMBAR THUMBNAIL */}
                                <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                                    <img
                                        src={
                                            item.gambar
                                                ? `/storage/${item.gambar}`
                                                : "/images/default-news.jpg"
                                        }
                                        alt={item.judul}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            // Fallback image placeholder generator jika gambar error
                                            e.target.src = `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(
                                                item.judul.substring(0, 10)
                                            )}`;
                                        }}
                                    />
                                    {/* Badge Tanggal (Overlay) */}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm flex items-center gap-1">
                                        <IconCalendar className="w-3 h-3 text-blue-500" />
                                        {formatDate(item.tanggal)}
                                    </div>
                                </div>

                                {/* CONTENT BODY */}
                                <div className="p-6 flex-1 flex flex-col">
                                    {/* Author & Meta */}
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                                            <IconUser className="w-3 h-3" />{" "}
                                            {item.author || "Admin"}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {item.status === "published"
                                                ? "Publik"
                                                : "Draft"}
                                        </span>
                                    </div>

                                    {/* Judul */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {item.judul}
                                    </h3>

                                    {/* Excerpt / Ringkasan Isi */}
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                        {truncateText(item.isi, 120)}
                                    </p>

                                    {/* Footer Card (Tombol Baca) */}
                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <button
                                            // Nantinya bisa diarahkan ke halaman detail berita: route('landing.berita.detail', item.id_berita)
                                            className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all"
                                        >
                                            Baca Selengkapnya{" "}
                                            <IconChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        // EMPTY STATE
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <IconNews className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">
                                Tidak ada berita ditemukan
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Coba ubah kata kunci pencarian Anda atau kembali
                                lagi nanti untuk informasi terbaru.
                            </p>
                            {state.search && (
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        router.get(route("landing.berita"));
                                    }}
                                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                >
                                    Hapus Filter Pencarian
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* --- PAGINATION --- */}
                <div className="mt-12">
                    <Pagination links={contentData.links} />
                </div>
            </div>
        </LandingLayout>
    );
}
