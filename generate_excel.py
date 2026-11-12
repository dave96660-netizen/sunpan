import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

def create_excel_files():
    # -------------------------------------------------------------
    # 1. 학생_실험_기록용_양식.xlsx
    # -------------------------------------------------------------
    wb_template = openpyxl.Workbook()
    ws = wb_template.active
    ws.title = "실험_측정_기록표"

    # 스타일 정의
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Malgun Gothic", size=11, bold=True, color="FFFFFF")
    title_font = Font(name="Malgun Gothic", size=15, bold=True, color="1E3A8A")
    meta_font = Font(name="Malgun Gothic", size=10, bold=True, color="334155")
    cell_font = Font(name="Malgun Gothic", size=10)
    center_align = Alignment(horizontal="center", vertical="center")
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    # 타이틀
    ws.merge_cells("A1:H1")
    ws["A1"] = "[인천 부광고 과학 탐구] 태양광 패널 및 편광판 각도별 발전 실험 기록표"
    ws["A1"].font = title_font
    ws["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[1].height = 32

    # 메타 정보란
    ws["A3"] = "학번 / 이름:"
    ws["A3"].font = meta_font
    ws["C3"] = "실험 일시:"
    ws["C3"].font = meta_font
    ws["E3"] = "실험 장소:"
    ws["E3"].font = meta_font
    ws["F3"] = "인천 부광고등학교 과학실험실"
    ws["F3"].font = cell_font

    ws["A4"] = "기준 날씨:"
    ws["A4"].font = meta_font
    ws["C4"] = "패널 경사각:"
    ws["C4"].font = meta_font
    ws["D4"] = "37도 (인천 최적각)"
    ws["D4"].font = cell_font

    # 테이블 헤더
    headers = [
        "실험 번호",
        "제1 편광판 각도(θ1, °)",
        "제2 편광판 각도(θ2, °)",
        "사이 각도차(Δθ, °)",
        "측정 전압(V)",
        "측정 전류(mA)",
        "측정 전력(W)",
        "비고 (오차 원인 및 관찰)"
    ]

    ws.row_dimensions[6].height = 26
    for col_idx, h in enumerate(headers, start=1):
        cell = ws.cell(row=6, column=col_idx, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = thin_border

    # 기본 각도 행 세팅 (0, 15, 30, 45, 60, 75, 90도)
    angles = [0, 15, 30, 45, 60, 75, 90]
    for idx, deg in enumerate(angles, start=1):
        row_num = 6 + idx
        ws.row_dimensions[row_num].height = 22
        ws.cell(row=row_num, column=1, value=idx).alignment = center_align
        ws.cell(row=row_num, column=2, value=0).alignment = center_align
        ws.cell(row=row_num, column=3, value=deg).alignment = center_align
        ws.cell(row=row_num, column=4, value=f"=ABS(C{row_num}-B{row_num})").alignment = center_align # 각도차 수식
        ws.cell(row=row_num, column=5, value="").alignment = center_align
        ws.cell(row=row_num, column=6, value="").alignment = center_align
        # 전력 자동계산 수식: =E{row}*(F{row}/1000)
        ws.cell(row=row_num, column=7, value=f"=IF(AND(ISNUMBER(E{row_num}),ISNUMBER(F{row_num})), ROUND(E{row_num}*(F{row_num}/1000), 4), \"\")").alignment = center_align
        ws.cell(row=row_num, column=8, value="").alignment = Alignment(horizontal="left", vertical="center")

        for c in range(1, 9):
            ws.cell(row=row_num, column=c).font = cell_font
            ws.cell(row=row_num, column=c).border = thin_border

    # 열 너비 조정
    widths = [10, 22, 22, 18, 14, 14, 15, 30]
    for col_idx, w in enumerate(widths, start=1):
        col_letter = openpyxl.utils.get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = w

    wb_template.save("학생_실험_기록용_양식.xlsx")
    print("학생_실험_기록용_양식.xlsx 생성 완료")

    # -------------------------------------------------------------
    # 2. 실제_실험_데이터_샘플(인천부광고).xlsx
    # -------------------------------------------------------------
    wb_sample = openpyxl.Workbook()
    ws_s = wb_sample.active
    ws_s.title = "실험_측정_기록표"

    # 복제 및 샘플값 채우기
    ws_s.merge_cells("A1:H1")
    ws_s["A1"] = "[인천 부광고 과학 탐구] 태양광 패널 및 편광판 각도별 발전 실험 기록표 (샘플)"
    ws_s["A1"].font = title_font
    ws_s["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws_s.row_dimensions[1].height = 32

    ws_s["A3"] = "학번 / 이름:"
    ws_s["B3"] = "부광고 2학년 3반 1조"
    ws_s["C3"] = "실험 일시:"
    ws_s["D3"] = "2026-11-09"
    ws_s["E3"] = "실험 장소:"
    ws_s["F3"] = "인천 부광고 과학실"

    for c in ["A3", "C3", "E3"]:
        ws_s[c].font = meta_font
    for c in ["B3", "D3", "F3"]:
        ws_s[c].font = cell_font

    ws_s.row_dimensions[6].height = 26
    for col_idx, h in enumerate(headers, start=1):
        cell = ws_s.cell(row=6, column=col_idx, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = thin_border

    # 실제 부광고 실험 측정 샘플 데이터
    sample_records = [
        (1, 0, 0, 0, 6.12, 141.2, 0.864, "평행 배치, 최대 투과"),
        (2, 0, 15, 15, 6.08, 131.8, 0.801, "투과율 약 93%"),
        (3, 0, 30, 30, 5.95, 107.5, 0.640, "투과율 약 75% (cos² 30°)"),
        (4, 0, 45, 45, 5.82, 73.5, 0.428, "이론상 50% 절반 투과 지점"),
        (5, 0, 60, 60, 5.51, 38.6, 0.213, "투과율 약 25% (cos² 60°)"),
        (6, 0, 75, 75, 4.85, 12.1, 0.059, "빛이 크게 어두워짐"),
        (7, 0, 90, 90, 1.35, 2.8, 0.004, "직교 차단 (실내 산란광 미량 잔류)")
    ]

    for idx, (no, p1, p2, diff, v, i, p, note) in enumerate(sample_records, start=1):
        row_num = 6 + idx
        ws_s.row_dimensions[row_num].height = 22
        ws_s.cell(row=row_num, column=1, value=no).alignment = center_align
        ws_s.cell(row=row_num, column=2, value=p1).alignment = center_align
        ws_s.cell(row=row_num, column=3, value=p2).alignment = center_align
        ws_s.cell(row=row_num, column=4, value=diff).alignment = center_align
        ws_s.cell(row=row_num, column=5, value=v).alignment = center_align
        ws_s.cell(row=row_num, column=6, value=i).alignment = center_align
        ws_s.cell(row=row_num, column=7, value=p).alignment = center_align
        ws_s.cell(row=row_num, column=8, value=note).alignment = Alignment(horizontal="left", vertical="center")

        for c in range(1, 9):
            ws_s.cell(row=row_num, column=c).font = cell_font
            ws_s.cell(row=row_num, column=c).border = thin_border

    for col_idx, w in enumerate(widths, start=1):
        col_letter = openpyxl.utils.get_column_letter(col_idx)
        ws_s.column_dimensions[col_letter].width = w

    wb_sample.save("실제_실험_데이터_샘플(인천부광고).xlsx")
    print("실제_실험_데이터_샘플(인천부광고).xlsx 생성 완료")

if __name__ == "__main__":
    create_excel_files()
