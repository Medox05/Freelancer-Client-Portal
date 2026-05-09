<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE milestones
            MODIFY status ENUM('pending', 'in_progress', 'completed', 'revision_requested', 'approved')
            DEFAULT 'pending'
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE milestones
            MODIFY status ENUM('pending', 'in_progress', 'completed', 'approved')
            DEFAULT 'pending'
        ");
    }
};