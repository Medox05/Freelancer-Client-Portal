<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('project_file_annotations', function (Blueprint $table) {
            $table->string('file_name')->nullable()->after('comment');
            $table->string('file_path')->nullable()->after('file_name');
            $table->string('mime_type')->nullable()->after('file_path');
            $table->unsignedBigInteger('file_size')->nullable()->after('mime_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_file_annotations', function (Blueprint $table) {
            $table->dropColumn([
                'file_name',
                'file_path',
                'mime_type',
                'file_size',
            ]);
        });
    }
};
