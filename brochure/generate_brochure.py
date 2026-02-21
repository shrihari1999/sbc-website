#!/usr/bin/env python3
"""
Share Business Concepts - Brochure Generator
Generates a 2-page PDF brochure for financial education services.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

# Page dimensions
WIDTH, HEIGHT = A4

# Colors - matched to original PDF
DARK_BG = HexColor('#0e1629')  # Dark navy background matching logo (rgb 14, 22, 41)
CARD_BG = HexColor('#162d44')  # Card background
ACCENT_BLUE = HexColor('#3a9db5')  # Blue accent color (rgb 58, 157, 181)
TEXT_WHITE = HexColor('#FFFFFF')  # Pure white
TEXT_LIGHT = HexColor('#FFFFFF')  # Body text - white
HIGHLIGHT_BAR = HexColor('#3a9a8f')
PRICE_BG = HexColor('#3a9db5')  # Same as heading font color

# Logo path
LOGO_PATH = "/mnt/user-data/uploads/logo.png"

def draw_rounded_rect(c, x, y, width, height, radius, fill_color=None, stroke_color=None):
    """Draw a proper rounded rectangle."""
    c.saveState()
    if fill_color:
        c.setFillColor(fill_color)
    if stroke_color:
        c.setStrokeColor(stroke_color)
    
    # Draw rounded rectangle using roundRect
    c.roundRect(x, y, width, height, radius, fill=1 if fill_color else 0, stroke=1 if stroke_color else 0)
    
    c.restoreState()

def draw_checkmark(c, x, y, size=12):
    """Draw a cyan checkmark icon."""
    c.saveState()
    c.setFillColor(ACCENT_BLUE)
    # Draw circle background
    c.circle(x + size/2, y + size/2, size/2, fill=1, stroke=0)
    # Draw checkmark
    c.setStrokeColor(DARK_BG)
    c.setLineWidth(1.5)
    c.line(x + size*0.25, y + size*0.5, x + size*0.45, y + size*0.3)
    c.line(x + size*0.45, y + size*0.3, x + size*0.75, y + size*0.7)
    c.restoreState()

def draw_logo(c, x, y, width=180, height=150):
    """Draw the logo from image file."""
    try:
        logo = ImageReader(LOGO_PATH)
        # Center the logo
        c.drawImage(logo, x - width/2, y - height/2, width=width, height=height, 
                   preserveAspectRatio=True, mask='auto')
    except Exception as e:
        print(f"Error loading logo: {e}")
        # Fallback - just draw placeholder text
        c.setFillColor(ACCENT_BLUE)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(x, y, "[LOGO]")

def draw_feature_card(c, x, y, width, height, title, subtitle):
    """Draw a feature card with checkmark."""
    draw_rounded_rect(c, x, y, width, height, 5, fill_color=CARD_BG)
    
    # Checkmark
    draw_checkmark(c, x + 15, y + height - 25, 18)
    
    # Title - positioned higher
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 45, y + height - 20, title)
    
    # Subtitle
    c.setFillColor(TEXT_LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(x + 45, y + height - 36, subtitle)

def create_page1(c):
    """Create the first page - Overview."""
    # Background
    c.setFillColor(DARK_BG)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    
    # Logo (includes company name and tagline)
    draw_logo(c, WIDTH/2, HEIGHT - 115, width=320, height=260)
    
    # Main tagline
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Oblique", 14)
    c.drawCentredString(WIDTH/2, HEIGHT - 250, "Empowering Financial Knowledge for Real-World Success")
    
    # Underline
    c.setStrokeColor(ACCENT_BLUE)
    c.setLineWidth(1.5)
    c.line(WIDTH/2 - 50, HEIGHT - 262, WIDTH/2 + 50, HEIGHT - 262)
    
    # Description
    c.setFillColor(TEXT_LIGHT)
    c.setFont("Helvetica", 10)
    desc_line1 = "Professional financial education platform offering structured online training"
    desc_line2 = "in stock market fundamentals, technical analysis, options trading and NISM exam preparation."
    c.drawCentredString(WIDTH/2, HEIGHT - 310, desc_line1)
    c.drawCentredString(WIDTH/2, HEIGHT - 324, desc_line2)
    
    # "Why Choose Us?" header
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(WIDTH/2, HEIGHT - 380, "Why Choose Us?")
    
    # Feature cards - 2 columns, 4 rows
    card_width = 235
    card_height = 50
    left_x = 40
    right_x = WIDTH - 40 - card_width
    start_y = HEIGHT - 470
    gap = 58
    
    features = [
        ("100% Online Interactive Classes", "Live engaging sessions"),
        ("Max 7 Per Batch", "Personalized attention"),
        ("Beginner-Friendly", "No prior knowledge needed"),
        ("Practical Focus", "Real-world trading skills"),
        ("Daily Doubt Clarification", "15 mins/day for 1 month"),
        ("Hand-Holding", "1-2 months post-training"),
        ("No Upper Age Limit", "Earn till you think"),
        ("Comfortable Timing", "For all timezones"),
    ]
    
    for i, (title, subtitle) in enumerate(features):
        row = i // 2
        col = i % 2
        x = left_x if col == 0 else right_x
        y = start_y - row * gap
        draw_feature_card(c, x, y, card_width, card_height, title, subtitle)
    
    # "Get Started Today!" section - position after 4 rows of cards
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(WIDTH/2, HEIGHT - 720, "Get Started Today!")
    
    # Bottom tagline
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(WIDTH/2, 55, "Learn. Analyze. Trade with Confidence.")
    
    # Footer with clickable links
    draw_footer(c)

def draw_footer(c):
    """Draw footer contact info with clickable hyperlinks."""
    footer_y = 30
    font_name = "Helvetica-Bold"
    font_size = 10
    c.setFont(font_name, font_size)
    
    # Calculate positions for centered footer
    footer_text = "WhatsApp: 7904472956 | Instagram: @sharebusinessconcepts | YouTube: @sharebusinessconcepts"
    total_width = c.stringWidth(footer_text, font_name, font_size)
    start_x = (WIDTH - total_width) / 2
    
    link_height = 14  # Height of clickable area
    
    # --- WhatsApp ---
    wa_label = "WhatsApp: "
    wa_value = "7904472956"
    wa_start = start_x
    
    c.setFillColor(TEXT_WHITE)
    c.drawString(start_x, footer_y, wa_label)
    start_x += c.stringWidth(wa_label, font_name, font_size)
    
    c.setFillColor(ACCENT_BLUE)
    c.drawString(start_x, footer_y, wa_value)
    wa_value_width = c.stringWidth(wa_value, font_name, font_size)
    start_x += wa_value_width
    
    # Clickable area covers "WhatsApp: 7904472956"
    wa_link_width = start_x - wa_start
    c.linkURL("https://wa.me/917904472956",
              (wa_start, footer_y - 2, wa_start + wa_link_width, footer_y + link_height),
              relative=0)
    
    # Separator
    c.setFillColor(TEXT_WHITE)
    c.drawString(start_x, footer_y, " | ")
    start_x += c.stringWidth(" | ", font_name, font_size)
    
    # --- Instagram ---
    ig_label = "Instagram: "
    ig_value = "@sharebusinessconcepts"
    ig_start = start_x
    
    c.setFillColor(TEXT_WHITE)
    c.drawString(start_x, footer_y, ig_label)
    start_x += c.stringWidth(ig_label, font_name, font_size)
    
    c.setFillColor(ACCENT_BLUE)
    c.drawString(start_x, footer_y, ig_value)
    ig_value_width = c.stringWidth(ig_value, font_name, font_size)
    start_x += ig_value_width
    
    # Clickable area covers "Instagram: @sharebusinessconcepts"
    ig_link_width = start_x - ig_start
    c.linkURL("https://www.instagram.com/sharebusinessconcepts",
              (ig_start, footer_y - 2, ig_start + ig_link_width, footer_y + link_height),
              relative=0)
    
    # Separator
    c.setFillColor(TEXT_WHITE)
    c.drawString(start_x, footer_y, " | ")
    start_x += c.stringWidth(" | ", font_name, font_size)
    
    # --- YouTube ---
    yt_label = "YouTube: "
    yt_value = "@sharebusinessconcepts"
    yt_start = start_x
    
    c.setFillColor(TEXT_WHITE)
    c.drawString(start_x, footer_y, yt_label)
    start_x += c.stringWidth(yt_label, font_name, font_size)
    
    c.setFillColor(ACCENT_BLUE)
    c.drawString(start_x, footer_y, yt_value)
    yt_value_width = c.stringWidth(yt_value, font_name, font_size)
    start_x += yt_value_width
    
    # Clickable area covers "YouTube: @sharebusinessconcepts"
    yt_link_width = start_x - yt_start
    c.linkURL("https://www.youtube.com/@sharebusinessconcepts",
              (yt_start, footer_y - 2, yt_start + yt_link_width, footer_y + link_height),
              relative=0)

def draw_program_card(c, x, y, width, program_type, title, price, details):
    """Draw a training program card with proper text wrapping."""
    # Calculate height based on content
    line_height = 13
    header_height = 25
    
    # Wrap text for each detail line
    wrapped_details = []
    max_chars = int(width / 4.5)  # Approximate chars that fit
    
    for detail in details:
        if len(detail) > max_chars:
            # Simple word wrap
            words = detail.split()
            current_line = ""
            for word in words:
                if len(current_line + " " + word) <= max_chars:
                    current_line = (current_line + " " + word).strip()
                else:
                    if current_line:
                        wrapped_details.append(current_line)
                    current_line = word
            if current_line:
                wrapped_details.append(current_line)
        else:
            wrapped_details.append(detail)
    
    total_height = header_height + len(wrapped_details) * line_height + 15
    
    # Card background
    draw_rounded_rect(c, x, y - total_height, width, total_height, 5, fill_color=CARD_BG)
    
    # Program type and title header
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x + 10, y - 18, f"{program_type}: {title}")
    
    # Price in rounded rectangle
    price_width = 70
    price_height = 20
    price_x = x + width - price_width - 10
    price_y = y - 25
    draw_rounded_rect(c, price_x, price_y, price_width, price_height, 3, fill_color=PRICE_BG)
    c.setFillColor(TEXT_WHITE)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(price_x + price_width/2, price_y + 6, price)
    
    # Details with bullet points
    c.setFillColor(TEXT_LIGHT)
    c.setFont("Helvetica", 8)
    for i, detail in enumerate(wrapped_details):
        # Add bullet only for first line of each original detail
        prefix = "• " if (i == 0 or wrapped_details[i-1] in [d.split()[0] if d else "" for d in details]) else "  "
        # Check if this is a continuation line
        is_continuation = False
        char_count = 0
        for orig_detail in details:
            if detail in orig_detail and detail != orig_detail.split()[0]:
                is_continuation = True
                break
        
        if any(detail == d or detail == d[:len(detail)] for d in details):
            c.drawString(x + 12, y - 35 - i * line_height, f"• {detail}")
        else:
            c.drawString(x + 20, y - 35 - i * line_height, detail)
    
    return total_height

def create_page2(c):
    """Create the second page - Training Programs."""
    # Background
    c.setFillColor(DARK_BG)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    
    # Header
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(WIDTH/2, HEIGHT - 100, "Our Online Training Programs")
    
    # Programs data - Type 1 on left, Type 2 on right
    left_programs = [
        ("TYPE 1", "4-Day Program", "Rs. 20,000", [
            "Ideal for traders/investors",
            "Duration: 4 days (4 hrs/day)",
            "Structure: 2 days Theory + 2 days Practical",
            "Stock market basics",
            "Fundamental & Technical analysis",
            "Intro to options"
        ]),
        ("TYPE 3", "Pure Fundamentals", "Rs. 10,000", [
            "Ideal for FinCo employees",
            "Duration: 1 day (6 hrs)",
            "Analysing financial statements & Balance Sheets",
            "Participating in company concalls"
        ]),
        ("TYPE 5", "NISM Exam Training", "Rs. 10,000", [
            "For certification & compliance",
            "Duration: 3 days (3 hrs/day)",
            "Complete exam preparation",
            "Study materials",
            "High success rate"
        ]),
    ]
    
    right_programs = [
        ("TYPE 2", "2-Day Program", "Rs. 25,000", [
            "Fast track version of Type 1",
            "Duration: 2 days (8 hrs/day)",
            "Theory & Practicals combined"
        ]),
        ("TYPE 4", "Options Strategies", "Rs. 15,000", [
            "Only after Type 1 or Type 2",
            "Duration: 2 days (Theory + Practical)",
            "Options strategies",
            "Risk management",
            "Advanced trading setups"
        ]),
    ]
    
    # Two-column layout with relaxed margins
    col_width = 255
    left_x = 25
    right_x = WIDTH - 25 - col_width
    
    # Left column - track the bottom position
    left_y = HEIGHT - 135
    for prog in left_programs:
        height = draw_program_card_simple(c, left_x, left_y, col_width, *prog)
        left_y -= height + 15
    
    # Right column
    right_y = HEIGHT - 135
    for prog in right_programs:
        height = draw_program_card_simple(c, right_x, right_y, col_width, *prog)
        right_y -= height + 15
    
    # Additional Benefits section - positioned after the cards with tripled margin
    benefits_y = min(left_y, right_y) - 80
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(WIDTH/2, benefits_y, "Additional Benefits")
    
    # Two benefit cards
    benefit_width = 255
    benefit_height = 65
    
    # Doubt Clarification card
    draw_rounded_rect(c, left_x, benefits_y - 90, benefit_width, benefit_height, 5, fill_color=CARD_BG)
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(left_x + 15, benefits_y - 45, "Doubt Clarification Sessions")
    c.setFillColor(TEXT_LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(left_x + 15, benefits_y - 60, "15 minutes every working day")
    c.drawString(left_x + 15, benefits_y - 73, "for 1 month post training")
    
    # Hand-Holding Support card
    draw_rounded_rect(c, right_x, benefits_y - 90, benefit_width, benefit_height, 5, fill_color=CARD_BG)
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(right_x + 15, benefits_y - 45, "Hand-Holding Support")
    c.setFillColor(TEXT_LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(right_x + 15, benefits_y - 60, "1 month for men")
    c.drawString(right_x + 15, benefits_y - 73, "2 months for women")
    
    # Footer with clickable links
    draw_footer(c)

def draw_program_card_simple(c, x, y, width, program_type, title, price, details):
    """Draw a training program card with simple layout."""
    line_height = 14
    header_height = 28
    total_height = header_height + len(details) * line_height + 15
    
    # Card background
    draw_rounded_rect(c, x, y - total_height, width, total_height, 5, fill_color=CARD_BG)
    
    # Program type and title header
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 12, y - 18, f"{program_type}: {title}")
    
    # Price in rounded rectangle
    price_width = 70
    price_height = 20
    price_x = x + width - price_width - 10
    price_y = y - 25
    draw_rounded_rect(c, price_x, price_y, price_width, price_height, 3, fill_color=PRICE_BG)
    c.setFillColor(TEXT_WHITE)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(price_x + price_width/2, price_y + 6, price)
    
    # Details
    c.setFillColor(TEXT_LIGHT)
    c.setFont("Helvetica", 9)
    for i, detail in enumerate(details):
        c.drawString(x + 14, y - 38 - i * line_height, f"• {detail}")
    
    return total_height

def generate_brochure(output_path="Share_Business_Concepts_Brochure.pdf"):
    """Generate the complete brochure."""
    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle("Share Business Concepts")
    
    # Page 1
    create_page1(c)
    c.showPage()
    
    # Page 2
    create_page2(c)
    c.showPage()
    
    c.save()
    print(f"Brochure generated: {output_path}")
    return output_path

if __name__ == "__main__":
    output_file = generate_brochure("/mnt/user-data/outputs/Share_Business_Concepts_Brochure.pdf")
