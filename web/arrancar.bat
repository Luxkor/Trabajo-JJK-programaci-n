@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title JJK Battle Server

:: ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
::  JJK BATTLE ??? ARRANQUE AUTOM??TICO (Windows)
::  100%% sin permisos de administrador.
::  Coloca este archivo en jjk-battle\web\
:: ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

set NODE_VERSION=v22.13.1
set SCRIPT_DIR=%~dp0
set NODE_DIR=%SCRIPT_DIR%node_portable
set NODE_EXE=%NODE_DIR%\node.exe
set NPM_CMD=%NODE_DIR%\npm.cmd
set NODE_ZIP=%SCRIPT_DIR%node_tmp.zip
set NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%-win-x64.zip

echo.
echo  =================================================
echo   JUJUTSU KAISEN  ^|  BATTLE SYSTEM
echo  =================================================
echo.

:: ?????? Paso 1: Usar Node.js incluido ???????????????????????????????????????????????????
if not exist "%NODE_EXE%" (
    echo.
    echo  [ERROR] Node.js portable no encontrado.
    echo  Asegurate de distribuir "node_portable\" junto al juego.
    echo  No se requiere descargar nada para jugar en LAN.
    pause & exit /b 1
)

goto :node_ok

:node_ok
for /f "tokens=*" %%V in ('"%NODE_EXE%" --version 2^>nul') do set NODE_VER=%%V
echo  [1/4] Node.js %NODE_VER% disponible.

echo.
:: ?????? Paso 2: Usar dependencias incluidas ??????????????????????????????
if not exist "%SCRIPT_DIR%node_modules\express\package.json" (
    echo  [ERROR] Dependencias del servidor no encontradas.
    echo  Asegurate de distribuir "node_modules\" completo con el juego.
    echo  Este script no descargara paquetes adicionales.
    pause & exit /b 1
)

echo  [2/4] Dependencias ya instaladas.
echo.

:: ?????? Paso 3: Elegir modo de red ????????????????????????????????????????????????????????????
:modo_menu
echo.
echo  -------------------------------------------------
echo   COMO QUIERES JUGAR?
echo.
echo   1) Red local (LAN / WiFi)
echo      Ambos PCs deben estar en la misma red.
echo      NOTA: Windows puede pedir confirmacion del
echo      firewall la primera vez. Elige "Red privada"
echo      o "Permitir acceso". NO requiere admin.
echo.
echo  2) Tunel internet (opcional)
echo      Genera una URL publica que funciona desde
echo      cualquier red. Requiere internet y localtunnel.
echo      No es necesario para multijugador local.
echo.
echo  3) Peer-to-Peer (WebRTC)
echo      Conexion directa P2P sin servidor central.
echo      Ambos en la misma red local o internet.
echo      Requiere intercambiar codigos de conexion.
echo.
echo  -------------------------------------------------
set /p MODO="  Opcion (1, 2 o 3): "

if "%MODO%"=="1" goto :modo_lan
if "%MODO%"=="2" goto :modo_tunel
if "%MODO%"=="3" goto :modo_p2p

echo  Opcion no valida. Elige 1, 2 o 3.
goto :modo_menu

:: ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
::  MODO 1: LAN DIRECTO
:: ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
:modo_lan

set LOCAL_IPS=
for /f "tokens=2 delims=:" %%I in (
    'ipconfig ^| findstr /i "IPv4" ^| findstr /v "169.254"'
) do (
    set "RAW=%%I"
    call set "RAW=%%RAW: =%%"
    if not defined LOCAL_IPS (
        set LOCAL_IPS=!RAW!
    ) else (
        set LOCAL_IPS=!LOCAL_IPS! / !RAW!
    )
    if not defined LOCAL_IP set LOCAL_IP=!RAW!
)

echo.
echo  [3/4] Intentando configurar firewall para puerto 3000...
echo.

:: Intentar añadir la regla de firewall sin admin
netsh advfirewall firewall show rule name="JJK Battle Server" >nul 2>&1
if errorlevel 1 (
    echo  Configurando firewall para redes privadas...
    netsh advfirewall firewall add rule name="JJK Battle Server" protocol=TCP dir=in localport=3000 action=allow profile=private >nul 2>&1
    
    if errorlevel 1 (
        echo  [AVISO] No se pudo agregar la regla de firewall automáticamente.
        echo.
        echo  ┌─────────────────────────────────────────────────────────────┐
        echo  │ SOLUCIONES:                                                 │
        echo  │                                                             │
        echo  │ A) Ejecuta este script como ADMINISTRADOR:                 │
        echo  │    - Click derecho en arrancar.bat                         │
        echo  │    - "Ejecutar como administrador"                         │
        echo  │    - Elige opción 1 nuevamente                            │
        echo  │                                                             │
        echo  │ B) Desactiva el firewall temporalmente:                    │
        echo  │    - Windows Defender Firewall^(Conf. avanzada^)          │
        echo  │    - Desactivar para redes privadas                       │
        echo  │    - Luego reactive después de jugar                      │
        echo  │                                                             │
        echo  │ C) Permite puerto 3000 manualmente:                        │
        echo  │    - Busca "Firewall" ^(Windows Defender^)                │
        echo  │    - "Permitir una aplicación"                            │
        echo  │    - Agrega puerto 3000 TCP                               │
        echo  └─────────────────────────────────────────────────────────────┘
        echo.
        pause
    ) else (
        echo  [OK] Firewall configurado para puerto 3000.
    )
) else (
    echo  [OK] Regla de firewall ya existe.
)

echo.
echo  [4/4] Modo: Red local (LAN)
echo  [4/4] Arrancando servidor...
echo.
echo  -------------------------------------------------
echo   Mismo PC   ^>  http://localhost:3000

:: Obtener SOLO la primer IP
if defined LOCAL_IP (
    echo   Otro PC    ^>  http://%LOCAL_IP%:3000
    echo.
    echo   ^> La URL del otro PC ha sido copiada al portapapeles.
    echo   ^> El otro jugador abre esa URL en su navegador.
    echo   ^> Ambos deben estar en la misma WiFi / LAN.
    echo.
    echo   ^> Puerto: 3000 (firewall configurado para redes privadas)
    echo   ^> Si el otro PC no se conecta:
    echo   ^>   1. Verifica que estén en misma red WiFi
    echo   ^>   2. Desactiva firewall temporalmente
    echo   ^>   3. O ejecuta este script como admin UNA sola vez
    echo.
    REM Copiar URL al portapapeles
    echo http://%LOCAL_IP%:3000 | clip
) else (
    echo   [AVISO] No se detectó IP local.
    echo           Comprueba que estás conectado a la red.
)

echo.
echo   Ctrl+C para detener.
echo.

cd /d "%SCRIPT_DIR%"
set PORT_IN_USE=
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000" ^| findstr /I "LISTENING"') do set PORT_IN_USE=%%P
if defined PORT_IN_USE (
    echo.
    echo  [ERROR] El puerto 3000 ya está en uso por el proceso PID %PORT_IN_USE%.
    echo          Cierra el servidor existente o reinicia el equipo antes de volver a ejecutar.
    pause & exit /b 1
)
"%NODE_EXE%" server.js
goto :fin

:: ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
::  MODO 2: TUNEL (localtunnel)
:: ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
:modo_tunel

echo.
echo  [3/4] Modo: Tunel internet (localtunnel)

if not exist "%SCRIPT_DIR%node_modules\localtunnel\package.json" (
    echo.
    echo  [INFO] localtunnel no encontrado. Instalando con Node portable...
    if not exist "%NPM_CMD%" (
        echo  [ERROR] npm portable no encontrado en "%NPM_CMD%".
        echo          No se puede instalar localtunnel sin npm portable.
        pause & exit /b 1
    )
    cd /d "%SCRIPT_DIR%"
    call "%NPM_CMD%" install localtunnel --no-fund --no-audit
    if errorlevel 1 (
        echo.
        echo  [ERROR] No se pudo instalar localtunnel sin admin.
        echo          Revisa tu conexion a internet o usa modo LAN (opcion 1).
        pause & exit /b 1
    )
    if not exist "%SCRIPT_DIR%node_modules\localtunnel\package.json" (
        echo.
        echo  [ERROR] La instalacion de localtunnel no se completo correctamente.
        pause & exit /b 1
    )
)

echo  [4/4] Arrancando servidor con tunel...
echo.
echo  -------------------------------------------------
echo   Esperando URL publica...
echo   (puede tardar unos segundos)
echo.
echo   Cuando aparezca la URL, compartela con el
echo   otro jugador. Ambos usan esa misma URL,
echo   sin importar la red en la que esten.
echo  -------------------------------------------------
echo.
echo   Ctrl+C para detener.
echo.

cd /d "%SCRIPT_DIR%"
"%NODE_EXE%" server.js --tunnel
goto :fin

:: ════════════════════════════════════════════════════════════════════════════════════════════════════
::  MODO 3: PEER-TO-PEER (WebRTC)
:: ════════════════════════════════════════════════════════════════════════════════════════════════════
:modo_p2p

echo.
echo  [3/4] Modo: Peer-to-Peer (WebRTC)
echo.
echo  IMPORTANTE:
echo  - Ambos jugadores necesitan estar en la misma red local O ambos con internet.
echo  - En el juego, selecciona "PEER-TO-PEER" cuando se le solicite.
echo  - El servidor actuará como intermediario SOLO para intercambiar datos de conexión.
echo  - Luego, la conexión será directa entre los dos PCs.
echo.

set LOCAL_IPS=
for /f "tokens=2 delims=:" %%I in (
    'ipconfig ^| findstr /i "IPv4" ^| findstr /v "169.254"'
) do (
    set "RAW=%%I"
    call set "RAW=%%RAW: =%%"
    if not defined LOCAL_IPS (
        set LOCAL_IPS=!RAW!
    ) else (
        set LOCAL_IPS=!LOCAL_IPS! / !RAW!
    )
    if not defined LOCAL_IP set LOCAL_IP=!RAW!
)

cd /d "%SCRIPT_DIR%"
set PORT_IN_USE=
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000" ^| findstr /I "LISTENING"') do set PORT_IN_USE=%%P
if defined PORT_IN_USE (
    echo.
    echo  [ERROR] El puerto 3000 ya está en uso por el proceso PID %PORT_IN_USE%.
    echo          Cierra el servidor existente o reinicia el equipo antes de volver a ejecutar.
    pause & exit /b 1
)

echo.
echo  [4/4] Arrancando servidor con signaling P2P...
echo.
echo  -------------------------------------------------
echo   Mismo PC   ^>  http://localhost:3000

if defined LOCAL_IP (
    echo   Otro PC    ^>  http://%LOCAL_IP%:3000
    echo.
    echo   ^> Ambos jugadores abren su respectiva URL.
    echo   ^> En el juego, selecciona "PEER-TO-PEER".
    echo   ^> La conexión será directa entre los dos PCs.
    echo   ^> El servidor solo actúa como intermediario.
) else (
    echo   [AVISO] No se detectó IP local.
    echo           Comprueba que estás conectado a la red.
)

echo.
echo  Ctrl+C para detener.
echo.

"%NODE_EXE%" server.js
goto :fin

:fin
echo.
echo  El servidor se ha detenido.
pause


