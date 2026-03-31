"""Playwright tests for the redesigned caret/about-toggle button."""
import pytest
from playwright.sync_api import Page, expect

URL = "https://cloze-reader.cuny.qzz.io"

VIEWPORTS = [
    {"name": "iphone-se", "width": 375, "height": 667},
    {"name": "iphone-14", "width": 390, "height": 844},
    {"name": "ipad", "width": 768, "height": 1024},
    {"name": "desktop-1024", "width": 1024, "height": 768},
    {"name": "desktop-1440", "width": 1440, "height": 900},
    {"name": "desktop-1920", "width": 1920, "height": 1080},
]


@pytest.fixture(params=VIEWPORTS, ids=lambda v: v["name"])
def viewport(request):
    return request.param


def test_old_wrapper_gone(page: Page, viewport):
    page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
    page.goto(URL, wait_until="networkidle", timeout=30000)

    # Old floating wrapper must not exist
    old_wrap = page.locator("#scroll-toggle-wrap")
    assert old_wrap.count() == 0, "Old #scroll-toggle-wrap should be removed"


def test_caret_inside_footer(page: Page, viewport):
    page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
    page.goto(URL, wait_until="networkidle", timeout=30000)

    # Button must live inside sticky-controls > controls-inner
    btn = page.locator("#sticky-controls .controls-inner #scroll-toggle")
    assert btn.count() == 1, "Caret button must be inside sticky-controls .controls-inner"

    # Must have correct class
    assert "about-toggle-btn" in (btn.get_attribute("class") or ""), \
        "Button must have class about-toggle-btn"

    # Must contain the CSS chevron span
    chevron = page.locator("#scroll-toggle .about-chevron")
    assert chevron.count() == 1, "Caret button must contain .about-chevron span"


def test_no_overlap_above_footer(page: Page, viewport):
    page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
    page.goto(URL, wait_until="networkidle", timeout=30000)

    # Try to start the game to show sticky controls
    for selector in ["button:text('Start')", "button:text('Play')", "button:text('Begin')",
                      "[data-testid='start']"]:
        try:
            btn = page.locator(selector).first
            if btn.is_visible(timeout=2000):
                btn.click()
                page.wait_for_timeout(1000)
                break
        except Exception:
            pass

    footer = page.locator("#sticky-controls")
    try:
        footer.wait_for(state="visible", timeout=5000)
    except Exception:
        pytest.skip("Game did not start — sticky controls not visible")

    footer_box = footer.bounding_box()
    assert footer_box, "Footer has no bounding box"

    caret = page.locator("#scroll-toggle")
    if not caret.is_visible(timeout=2000):
        pytest.skip("Caret not visible after game start")

    caret_box = caret.bounding_box()
    assert caret_box, "Caret has no bounding box"

    # Caret must not float above the footer top
    assert caret_box["y"] >= footer_box["y"] - 2, (
        f"Caret top ({caret_box['y']:.0f}) is above footer top ({footer_box['y']:.0f}) "
        f"on {viewport['name']}"
    )

    # Caret must be within viewport vertically
    assert caret_box["y"] + caret_box["height"] <= viewport["height"] + 2, \
        f"Caret overflows viewport on {viewport['name']}"
