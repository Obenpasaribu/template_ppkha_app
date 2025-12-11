import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppLayout from "@/layouts/app-layout";
import { router, usePage } from "@inertiajs/react";
import * as Icon from "@tabler/icons-react";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { toast } from "sonner";
import { CreateSurveyDialog } from "./dialogs/create-survey-dialog";
import { DeleteSurveyDialog } from "./dialogs/delete-survey-dialog";
import { DetailSurveyDialog } from "./dialogs/detail-survey-dialog";
import { route } from "ziggy-js";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import dayjs from "dayjs";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

// Daftar Prodi
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

// Label Custom Donut
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
}) => {
    if (percent <= 0) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            className="text-xs font-bold pointer-events-none drop-shadow-md"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function UserSurveyPage() {
    const {
        surveyList,
        soalOptions,
        flash,
        statistics,
        prodiFilter: initialProdiFilter,
    } = usePage().props;

    const [search, setSearch] = React.useState("");
    const [prodiFilter, setProdiFilter] = React.useState(
        initialProdiFilter || "all"
    );

    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [dataDelete, setDataDelete] = React.useState(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
    const [dataDetail, setDataDetail] = React.useState(null);

    React.useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    // --- FUNGSI FILTER & NAVIGASI ---
    // Menerima parameter page secara eksplisit agar bisa lompat halaman
    const handleFilter = (newSearch, newProdi, page = 1) => {
        const params = {};
        const q = newSearch !== undefined ? newSearch : search;
        const p = newProdi !== undefined ? newProdi : prodiFilter;

        if (q) params.search = q;
        if (p && p !== "all") params.prodi = p;
        if (page > 1) params.page = page; // Tambahkan parameter page

        router.get(route("user-survey"), params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            handleFilter(search, undefined, 1); // Reset ke halaman 1 saat search
        }
    };

    // Fungsi khusus untuk ganti halaman
    const handlePageChange = (pageNumber) => {
        handleFilter(undefined, undefined, pageNumber);
    };

    const columns = [
        {
            header: "Penilai (Perusahaan)",
            accessorKey: "nama_penilai",
            cell: ({ row }) => (
                <div>
                    <div className="font-bold">{row.original.nama_penilai}</div>
                    <div className="text-xs text-gray-500">
                        {row.original.jabatan_saat_ini}
                    </div>
                    <div className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                        {row.original.nama_perusahaan}
                        {row.original.tingkat_perusahaan && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1 ml-1 text-gray-500 border-gray-300"
                            >
                                {row.original.tingkat_perusahaan}
                            </Badge>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: "Yang Dinilai (Alumni)",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border bg-gray-100">
                        <AvatarImage
                            src={
                                row.original.foto_dinilai
                                    ? `/storage/${row.original.foto_dinilai}`
                                    : null
                            }
                            alt={row.original.nama_dinilai}
                            className="object-cover"
                        />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {row.original.nama_dinilai
                                ? row.original.nama_dinilai
                                      .substring(0, 2)
                                      .toUpperCase()
                                : "AL"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">
                            {row.original.nama_dinilai}
                        </div>
                        <div className="text-xs text-gray-500">
                            {row.original.nim_dinilai}
                        </div>
                        <div className="text-xs text-gray-400">
                            {row.original.prodi} ({row.original.tahun_lulus})
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: "Waktu Dibuat",
            accessorKey: "tanggal_dibuat",
            cell: ({ row }) => (
                <div className="text-xs text-gray-500 font-mono">
                    {row.original.tanggal_dibuat
                        ? dayjs(row.original.tanggal_dibuat).format(
                              "DD MMM YYYY HH:mm"
                          )
                        : "-"}
                </div>
            ),
        },
        {
            header: "Waktu Submit",
            accessorKey: "tanggal_diedit",
            cell: ({ row }) => (
                <div className="text-xs text-gray-500 font-mono">
                    {row.original.status_survey === "sudah" &&
                    row.original.tanggal_diedit
                        ? dayjs(row.original.tanggal_diedit).format(
                              "DD MMM YYYY HH:mm"
                          )
                        : "-"}
                </div>
            ),
        },
        {
            header: "Status",
            accessorKey: "status_survey",
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.status_survey === "sudah"
                            ? "default"
                            : "secondary"
                    }
                >
                    {row.original.status_survey === "sudah"
                        ? "Selesai"
                        : "Belum Diisi"}
                </Badge>
            ),
        },
        {
            header: "Skor",
            cell: ({ row }) =>
                row.original.status_survey === "sudah" ? (
                    <span className="font-bold">
                        {row.original.total_skor}
                        <span className="text-gray-400 font-normal">
                            /{row.original.max_skor}
                        </span>{" "}
                        Poin
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
        },
        {
            id: "actions",
            header: "Aksi",
            cell: ({ row }) => {
                const survey = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <Icon.IconDotsVertical size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    setDataDetail(survey);
                                    setIsDetailDialogOpen(true);
                                }}
                            >
                                <Icon.IconEye
                                    size={16}
                                    className="mr-2 text-blue-600"
                                />{" "}
                                Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    navigator.clipboard.writeText(survey.token);
                                    toast.success("Token berhasil disalin!");
                                }}
                            >
                                <Icon.IconCopy size={16} className="mr-2" />{" "}
                                Salin Token
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        route("survey.form", {
                                            token: survey.token,
                                        })
                                    );
                                    toast.success("Link disalin!");
                                }}
                            >
                                <Icon.IconLink size={16} className="mr-2" />{" "}
                                Salin Link Langsung
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => {
                                    setDataDelete({
                                        ids: [survey.id_user_survey],
                                        dataList: [
                                            {
                                                name: survey.nama_penilai,
                                                company: survey.nama_perusahaan,
                                            },
                                        ],
                                    });
                                    setIsDeleteDialogOpen(true);
                                }}
                            >
                                <Icon.IconTrash size={16} className="mr-2" />{" "}
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: surveyList.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const totalRespondents =
        statistics?.donutData?.reduce((acc, curr) => acc + curr.value, 0) || 0;

    return (
        <AppLayout>
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Chart Components */}
                    <Card className="md:col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Icon.IconChartBar
                                    size={20}
                                    className="text-blue-600"
                                />
                                Kepuasan per Program Studi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={statistics.barData}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 0,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 12 }}
                                            interval={0}
                                            angle={-15}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            cursor={{ fill: "transparent" }}
                                            contentStyle={{
                                                borderRadius: "8px",
                                                border: "none",
                                                boxShadow:
                                                    "0 4px 12px rgba(0,0,0,0.1)",
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{
                                                paddingTop: "20px",
                                            }}
                                        />
                                        <Bar
                                            dataKey="Puas"
                                            name="Puas"
                                            stackId="a"
                                            fill="#22c55e"
                                            radius={[0, 0, 4, 4]}
                                            barSize={40}
                                        />
                                        <Bar
                                            dataKey="Tidak Puas"
                                            name="Tidak Puas"
                                            stackId="a"
                                            fill="#ef4444"
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Icon.IconChartPie
                                    size={20}
                                    className="text-green-600"
                                />
                                Persentase Global
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-center">
                            <div className="h-[250px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statistics.donutData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                        >
                                            {statistics.donutData.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.fill}
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip />
                                        <Legend
                                            layout="horizontal"
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                                    <span className="text-4xl font-extrabold text-gray-800">
                                        {totalRespondents}
                                    </span>
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                                        Responden
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icon.IconClipboardList />
                            <span>Daftar User Survey</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={prodiFilter}
                                onValueChange={(val) => {
                                    setProdiFilter(val);
                                    handleFilter(undefined, val, 1);
                                }}
                            >
                                <SelectTrigger className="w-[320px] h-9">
                                    <SelectValue placeholder="Semua Prodi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Prodi
                                    </SelectItem>
                                    {PRODI_OPTIONS.map((prodi) => (
                                        <SelectItem key={prodi} value={prodi}>
                                            {prodi}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputGroup className="w-[250px]">
                                <InputGroupInput
                                    placeholder="Cari nama..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                />
                                <InputGroupAddon>
                                    <Icon.IconSearch size={16} />
                                </InputGroupAddon>
                            </InputGroup>
                            <Button
                                variant="outline"
                                className="border-green-600 text-grey hover:bg-green-600"
                                onClick={() =>
                                    window.open(
                                        route("user-survey.export"),
                                        "_blank"
                                    )
                                }
                            >
                                <Icon.IconDownload size={16} className="mr-2" />{" "}
                                Export
                            </Button>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Icon.IconPlus size={16} className="mr-2" />{" "}
                                Buat
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border mb-4">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((hg) => (
                                    <TableRow key={hg.id}>
                                        {hg.headers.map((h) => (
                                            <TableHead key={h.id}>
                                                {flexRender(
                                                    h.column.columnDef.header,
                                                    h.getContext()
                                                )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            Belum ada data survey.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* === PAGINATION NUMBERED & ARROWS === */}
                    <div className="flex items-center justify-center gap-2 py-4">
                        {/* Tombol First Page */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            disabled={surveyList.current_page === 1}
                            className="gap-1 px-2 h-8"
                            title="Halaman Pertama"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        {/* Tombol Previous */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                handlePageChange(surveyList.current_page - 1)
                            }
                            disabled={!surveyList.prev_page_url}
                            className="gap-1 px-2 h-8"
                            title="Halaman Sebelumnya"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Nomor Halaman (Looping dari Links Laravel) */}
                        <div className="flex items-center gap-1 mx-2">
                            {surveyList.links &&
                                surveyList.links.slice(1, -1).map((link, i) => {
                                    // Jika label adalah "...", tampilkan span biasa
                                    if (link.label === "...") {
                                        return (
                                            <span
                                                key={i}
                                                className="px-2 text-sm text-muted-foreground"
                                            >
                                                ...
                                            </span>
                                        );
                                    }

                                    return (
                                        <Button
                                            key={i}
                                            // Jika halaman aktif, beri variant default (warna solid)
                                            variant={
                                                link.active
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            className={`w-8 h-8 p-0 ${
                                                link.active
                                                    ? "pointer-events-none"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                link.url &&
                                                router.visit(link.url)
                                            }
                                        >
                                            {/* Render label (nomor halaman) */}
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        </Button>
                                    );
                                })}
                        </div>

                        {/* Tombol Next */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                handlePageChange(surveyList.current_page + 1)
                            }
                            disabled={!surveyList.next_page_url}
                            className="gap-1 px-2 h-8"
                            title="Halaman Selanjutnya"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {/* Tombol Last Page */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                handlePageChange(surveyList.last_page)
                            }
                            disabled={
                                surveyList.current_page === surveyList.last_page
                            }
                            className="gap-1 px-2 h-8"
                            title="Halaman Terakhir"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                    {/* ========================================= */}
                </CardContent>
            </Card>

            <CreateSurveyDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                soalOptions={soalOptions}
            />
            <DeleteSurveyDialog
                dataDelete={dataDelete}
                openDialog={isDeleteDialogOpen}
                setOpenDialog={setIsDeleteDialogOpen}
            />
            <DetailSurveyDialog
                data={dataDetail}
                openDialog={isDetailDialogOpen}
                setOpenDialog={setIsDetailDialogOpen}
            />
        </AppLayout>
    );
}
