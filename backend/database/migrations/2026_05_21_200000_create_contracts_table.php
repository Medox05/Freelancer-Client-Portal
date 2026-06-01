<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('project_id')->constrained()->onDelete('cascade');
            $blueprint->string('title');
            $blueprint->longText('content');
            $blueprint->string('status')->default('draft'); // draft, sent, signed
            $blueprint->timestamp('signed_at')->nullable();
            $blueprint->string('client_signature_name')->nullable();
            $blueprint->string('signature_ip')->nullable();
            $blueprint->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
