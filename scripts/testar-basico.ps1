param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$Login = "admin",
  [string]$Senha = "123456"
)

Write-Host "1/5 - Health da API"
Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET | ConvertTo-Json

Write-Host "2/5 - Health do banco"
Invoke-RestMethod -Uri "$BaseUrl/health/db" -Method GET | ConvertTo-Json

Write-Host "3/5 - Login"
$body = @{ login = $Login; senha = $Senha } | ConvertTo-Json
$loginResponse = Invoke-RestMethod `
  -Uri "$BaseUrl/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$token = $loginResponse.token
if (-not $token) { throw "O login não retornou token." }
Write-Host "Login realizado."

Write-Host "4/5 - Perfil autenticado"
Invoke-RestMethod `
  -Uri "$BaseUrl/auth/me" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 5

Write-Host "5/5 - Listagem de cursos"
Invoke-RestMethod `
  -Uri "$BaseUrl/cursos" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 5

Write-Host "Testes básicos concluídos com sucesso."
