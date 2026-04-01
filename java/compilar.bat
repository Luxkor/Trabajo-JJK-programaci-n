@echo off
rem Compila y ejecuta el juego de consola JJK en Windows
echo Compilando JJK Battle System (Java)...
javac -encoding UTF-8 *.java
if %errorlevel% == 0 (
    echo Compilacion exitosa. Iniciando juego...
    java -Dfile.encoding=UTF-8 JuegoJJK
) else (
    echo Error de compilacion. Verifica que tienes JDK instalado con: java -version
)
