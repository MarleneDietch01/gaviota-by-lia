import sys
from playwright.sync_api import sync_playwright

url = sys.argv[1]
out = sys.argv[2]
wait_ms = int(sys.argv[3]) if len(sys.argv) > 3 else 1500

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.on("console", lambda msg: print("[console]", msg.type, msg.text))
    page.on("pageerror", lambda exc: print("[pageerror]", exc))
    page.on("requestfailed", lambda req: print("[requestfailed]", req.url, req.failure))
    page.on("response", lambda res: print("[response]", res.status, res.url) if res.status >= 400 else None)
    page.goto(url)
    page.wait_for_timeout(wait_ms)
    page.screenshot(path=out)
    browser.close()
print("saved", out)
