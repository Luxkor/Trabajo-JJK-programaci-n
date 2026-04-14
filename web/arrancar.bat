@echo off
chcp 65001 > nul
title JJK Battle Server

:: =================================================
::  JJK BATTLE - ARRANQUE AUTOMATICO (Windows)
::  100%% sin permisos de administrador.
::  Coloca este archivo en jjk-battle\web\
:: =================================================

set NODE_VERSION=v22.13.1
set SCRIPT_DIR=%~dp0
set NODE_DIR=%SCRIPT_DIR%node_portable
set NODE_EXE=%NODE_DIR%\node.exe
set NPM_CMD=%NODE_DIR%\npm.cmd
set NODE_ZIP=%SCRIPT_DIR%node_tmp.zip
set NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%-win-x64.zip
set PORT=3000

echo.
echo  =================================================
echo   JUJUTSU KAISEN ^| BATTLE SYSTEM
echo   Iniciando servidor...
echo  =================================================
echo.

:: Step 1: download Node.js if missing
if exist "%NODE_EXE%" goto node_ok

echo  [1/3] Node.js no encontrado. Descargando %NODE_VERSION%...
echo        Destino: %NODE_DIR%
echo.

if not exist "%NODE_DIR%" mkdir "%NODE_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%NODE_URL%', '%NODE_ZIP%')"

if not exist "%NODE_ZIP%" (
    echo.
    echo  [ERROR] No se pudo descargar Node.js automaticamente.
    echo.
    echo  Descarga manual:
    echo    1. Abre en el navegador: %NODE_URL%
    echo    2. Guarda el ZIP como:   %NODE_ZIP%
    echo    3. Vuelve a ejecutar este script.
    echo.
    pause
    exit /b 1
)

echo  [1/3] Descomprimiendo...

powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -Assembly 'System.IO.Compression.FileSystem'; $zip = [IO.Compression.ZipFile]::OpenRead('%NODE_ZIP%'); foreach ($entry in $zip.Entries) { $rel = ($entry.FullName -split '/', 2); if ($rel.Count -lt 2 -or $rel[1] -eq '') { continue }; $dest = [IO.Path]::Combine('%NODE_DIR%', $rel[1].Replace('/', '\')); $dir = [IO.Path]::GetDirectoryName($dest); if (-not (Test-Path $dir)) { [IO.Directory]::CreateDirectory($dir) | Out-Null }; if ($entry.Name) { $s = $entry.Open(); $f = [IO.File]::Create($dest); $s.CopyTo($f); $f.Dispose(); $s.Dispose() } }; $zip.Dispose()"

del "%NODE_ZIP%" 2>nul

if not exist "%NODE_EXE%" (
    echo.
    echo  [ERROR] La extraccion fallo. Comprueba espacio en disco.
    pause
    exit /b 1
)

echo  [1/3] Node.js listo.
echo.

:node_ok
for /f "tokens=*" %%V in ('"%NODE_EXE%" --version 2^>nul') do set NODE_VER=%%V
echo  [1/3] Node.js %NODE_VER% disponible.

:: Step 2: install deps if missing
if exist "%SCRIPT_DIR%node_modules\express\package.json" goto deps_ok

echo  [2/3] Instalando dependencias (solo la primera vez)...
echo.

cd /d "%SCRIPT_DIR%"

"%NPM_CMD%" install ^
    --no-global ^
    --ignore-scripts ^
    --no-audit ^
    --prefer-offline

if errorlevel 1 (
    echo.
    echo  [ERROR] Fallo la instalacion de dependencias.
    echo  Comprueba tu conexion a internet e intentalo de nuevo.
    pause
    exit /b 1
)

echo.
echo  [2/3] Dependencias instaladas.
echo.
goto start_server

:deps_ok
echo  [2/3] Dependencias ya instaladas.

:start_server

:: Buscar primer puerto libre entre 3000 y 3010
for /l %%P in (3000,1,3010) do (
    netstat -ano | findstr /C:":%%P " >nul
    if errorlevel 1 (
        set PORT=%%P
        goto port_found
    )
)
:port_found

set LOCAL_IP=no detectada
set LOCAL_IPS=
for /f "delims=" %%I in ('powershell -NoProfile -Command "(ipconfig | Select-String 'IPv4' | ForEach-Object { $_ -replace '^.*?:\s*','' } | Where-Object { $_ -notmatch '^169\.254\.' -and $_ -notmatch '^127\.' }) -join ','"') do set "LOCAL_IPS=%%I"
for /f "delims=" %%I in ('powershell -NoProfile -Command "$ips=(ipconfig | Select-String 'IPv4' | ForEach-Object { $_ -replace '^.*?:\s*','' } | Where-Object { $_ -notmatch '^169\.254\.' -and $_ -notmatch '^127\.' }); $preferred=$ips | Where-Object { $_ -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)' } | Select-Object -First 1; if ($preferred) { $preferred } elseif ($ips) { $ips[0] }"') do set "LOCAL_IP=%%I"
if not defined LOCAL_IP (
    for %%J in (%LOCAL_IPS:,= %) do (
        if not defined LOCAL_IP set "LOCAL_IP=%%J"
    )
)

:ip_found

echo.
echo  [3/3] Arrancando en http://localhost:%PORT%
echo.
echo  -------------------------------------------------
echo   COMO JUGAR:
echo.
echo   Mismo PC    ^>  http://localhost:%PORT%
echo   Red local   ^>  http://%LOCAL_IP%:%PORT%
if defined LOCAL_IPS echo   Direcciones IPv4 detectadas: %LOCAL_IPS%
set NETPROFILE=Desconocido
for /f "delims=" %%N in ('powershell -NoProfile -Command "(Get-NetConnectionProfile | Select-Object -First 1 -ExpandProperty NetworkCategory)"') do set "NETPROFILE=%%N"
echo   Perfil de red  ^>  %NETPROFILE%
if /i "%NETPROFILE%"=="Public" (
    echo.
    echo  [AVISO] Estas en una red Publica. Windows Firewall puede bloquear conexiones entrantes.
    echo  Cambia a Privada o permite el puerto %PORT% / node.exe en Firewall.
)
echo.
echo   El otro jugador usa la URL de Red local.
echo  -------------------------------------------------
echo.
echo   Ctrl+C para detener el servidor.
echo.

cd /d "%SCRIPT_DIR%"
"%NODE_EXE%" server.js

echo.
echo  El servidor se ha detenido.
pause
