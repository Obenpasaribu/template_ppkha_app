<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property array|null $jenis_soal
 */
class SoalModel extends Model
{
    use HasFactory;

    protected $table = 'm_soal';
    protected $primaryKey = 'id_soal';

    // === TAMBAHAN PENTING UNTUK UUID ===
    // 1. Beritahu Laravel kalau primary key bukan Integer (Auto Increment)
    public $incrementing = false;

    // 2. Beritahu Laravel kalau tipe datanya String (UUID itu string)
    protected $keyType = 'string';
    // ===================================

    // Custom Timestamp
    const CREATED_AT = 'tanggal_dibuat';
    const UPDATED_AT = 'tanggal_diedit';

    protected $fillable = [
        'id_soal', // Tambahkan ini jika Anda generate UUID manual/dari frontend
        'judul_soal',
        'jenis_soal',
        'status_soal',
    ];

    protected $casts = [
        'jenis_soal' => 'array',
        'id_soal' => 'string', // Pastikan dicasting sebagai string
    ];
}