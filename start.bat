@echo off
title Foster Sinav Sistemi - DEBUG MODU
color 0f
cls

echo ===============================================
echo   FOSTER SINAV SISTEMI - BASLATILIYOR
echo ===============================================
echo.

echo [ADIM 1] Node.js kontrol ediliyor...
where node
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [HATA] Node.js bulunamadi!
    echo Lütfen https://nodejs.org adresinden Node.js indirip kurun.
    echo.
    pause
    exit
)
echo OK: Node.js bulundu.
node -v
echo.

echo [ADIM 2] Dosyalar kontrol ediliyor...
if not exist server.js (
    color 0c
    echo [HATA] server.js bulunamadi!
    pause
    exit
)
echo OK: server.js bulundu.

echo [ADIM 3] Bagimliliklar (node_modules) kontrol ediliyor...
if not exist node_modules (
    echo [BILGI] node_modules klasoru yok. Yukleme yapiliyor...
    echo Bu islem internet hizina gore 1-2 dakika surebilir.
    call npm install
    if %errorlevel% neq 0 (
        color 0c
        echo [HATA] npm install basarisiz oldu.
        paddle
        exit
    )
    echo OK: Yukleme tamamlandi.
) else (
    echo OK: node_modules klasoru mevcut.
)
echo.

echo [ADIM 4] Sunucu baslatiliyor...
echo.
echo Tarayici birazdan acilacak...
echo Uygulamayi kapatmak icin bu pencereyi kapatin.
echo.
echo -----------------------------------------------
echo CALISIYOR... (Hata alirsaniz asagida gorunecektir)
echo -----------------------------------------------

call npm run dev

echo.
echo -----------------------------------------------
echo [UYARI] Uygulama beklenmedik sekilde kapandi!
echo -----------------------------------------------
pause