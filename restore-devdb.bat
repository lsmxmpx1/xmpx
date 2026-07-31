@echo off
REM 修复本地 dev.db：把已 seed 好的库复制回项目根目录
REM 用法：在 xiamenpeixun/ 目录下双击运行，或 PowerShell/CMD 中执行

SETLOCAL
SET "ROOT=%~dp0"
SET "SRC=C:\Users\admin\AppData\Local\Temp\xmseed\dev.db"

IF NOT EXIST "%SRC%" (
  echo [错误] 找不到已 seed 的临时库：%SRC%
  echo 请先确认沙箱已将种子库生成到该路径，或在本地重新执行 db push + seed。
  pause
  EXIT /B 1
)

COPY /Y "%SRC%" "%ROOT%dev.db" >NUL
IF ERRORLEVEL 1 (
  echo [失败] 复制 dev.db 到项目根失败（权限？）。请手动复制：
  echo   %SRC%  ->  %ROOT%dev.db
  pause
  EXIT /B 1
)

echo [成功] dev.db 已更新（含 6 篇文章 + views 浏览次数字段）。
echo 现在可运行：npm run dev  查看培训咨询与浏览次数效果。
ENDLOCAL
