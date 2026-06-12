$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8000/")
$listener.Start()
Write-Host "Listening on http://localhost:8000/ ..."

# Set up clean exit on stop
$running = $true
while ($running) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        
        # Clean paths to prevent directory traversal
        $cleanPath = $urlPath.Replace("..", "").TrimStart('/')
        $filePath = Join-Path "c:\Users\ASUS\Desktop\osr" $cleanPath
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Content Types
            if ($filePath -like "*.html") { $response.ContentType = "text/html; charset=utf-8" }
            elseif ($filePath -like "*.css") { $response.ContentType = "text/css; charset=utf-8" }
            elseif ($filePath -like "*.js") { $response.ContentType = "application/javascript; charset=utf-8" }
            else { $response.ContentType = "application/octet-stream" }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $response.ContentType = "text/plain"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $response.OutputStream.Close()
    } catch {
        # Silent fail or exit on listener close
        if (-not $listener.IsListening) {
            $running = $false
        }
    }
}
