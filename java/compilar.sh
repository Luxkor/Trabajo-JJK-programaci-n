#!/bin/bash
# Compila y ejecuta el juego de consola JJK en Java
# Uso: bash compilar.sh

echo "Compilando JJK Battle System (Java)..."
javac -encoding UTF-8 *.java

if [ $? -eq 0 ]; then
  echo "Compilación exitosa. Iniciando juego..."
  java -Dfile.encoding=UTF-8 JuegoJJK
else
  echo "Error de compilación. Verifica que tienes JDK instalado (java -version)"
fi
