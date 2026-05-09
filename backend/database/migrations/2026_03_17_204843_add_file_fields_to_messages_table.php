<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('message_type', 20)->default('text')->after('message');
            $table->string('file_name')->nullable()->after('message_type');
            $table->string('file_path')->nullable()->after('file_name');
            $table->string('mime_type')->nullable()->after('file_path');
            $table->unsignedBigInteger('file_size')->nullable()->after('mime_type');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn([
                'message_type',
                'file_name',
                'file_path',
                'mime_type',
                'file_size',
            ]);
        });
    }
};