<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class UserSurveyModel extends Model
{
    use HasFactory;

    // 1. Tentukan Nama Tabel
    protected $table = 't_user_survey';

    // 2. Tentukan Primary Key
    protected $primaryKey = 'id_user_survey';

    // 3. PENTING: Matikan Increment karena pakai UUID
    public $incrementing = false;

    // 4. PENTING: Tipe data Primary Key adalah string
    protected $keyType = 'string';

    // 5. Custom Nama Timestamp
    const CREATED_AT = 'tanggal_dibuat';
    const UPDATED_AT = 'tanggal_diedit';

    // 6. Daftar Kolom yang Boleh Diisi (Mass Assignment)
    protected $fillable = [
        'id_user_survey',
        'nama_penilai',
        'nama_perusahaan',
        'tingkat_perusahaan',
        'jabatan_saat_ini',
        'nama_dinilai',
        'nim_dinilai',
        'foto_dinilai',
        'prodi',
        'tahun_lulus',
        'masa_kerja',
        'dari',
        'id_soal',
        'token',
        'status_survey',
        'jawaban_detail',
        'total_skor',
    ];

    // 7. Casting tipe data
    protected $casts = [
        'jawaban_detail' => 'array',
        'total_skor' => 'integer',
        'id_soal' => 'string',
    ];

    // 8. Auto-Generate UUID saat Create
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // Jika ID belum ada, buatkan UUID baru
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    // ==========================================
    // BAGIAN YANG DITAMBAHKAN (RELASI)
    // ==========================================
    
    /**
     * Relasi ke model SoalModel.
     * Digunakan agar Controller bisa memanggil ->with('soal')
     */
    public function soal()
    {
        // belongsTo(NamaModel, Foreign_Key_Disini, Primary_Key_Disana)
        return $this->belongsTo(SoalModel::class, 'id_soal', 'id_soal');
    }
}