<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'invitation_token')) {
                $table->string('invitation_token')->nullable()->after('remember_token');
            }

            if (!Schema::hasColumn('users', 'invitation_expires_at')) {
                $table->timestamp('invitation_expires_at')->nullable()->after('invitation_token');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'invitation_expires_at')) {
                $table->dropColumn('invitation_expires_at');
            }

            if (Schema::hasColumn('users', 'invitation_token')) {
                $table->dropColumn('invitation_token');
            }
        });
    }
};