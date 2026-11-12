import zipfile, os, sys, csv, io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

sys.stdout.reconfigure(encoding='utf-8')

folder = '측정값'
files = [f'측정값 ({i}).zip' for i in range(1, 11)]

# 1. 데이터 파싱
file_records = []
all_raw_data = {}

for f in files:
    path = os.path.join(folder, f)
    with zipfile.ZipFile(path, 'r') as z:
        for name in z.namelist():
            if name.endswith('.csv'):
                content = z.read(name).decode('utf-8-sig', errors='ignore')
                reader = csv.DictReader(io.StringIO(content))
                rows = []
                volts = []
                brights = []
                temps = []
                for r in reader:
                    t_str = r['수집시간']
                    v = float(r['전압'])
                    b = float(r['밝기'])
                    t = float(r['온도'])
                    rows.append((t_str, t, v, b))
                    volts.append(v)
                    brights.append(b)
                    temps.append(t)
                
                num = int(f.split('(')[1].split(')')[0])
                ts = name.split('-')[-1].replace('.csv', '')
                
                rec = {
                    'file': f,
                    'num': num,
                    'csv_name': name,
                    'timestamp': ts,
                    'count': len(volts),
                    'avg_v': sum(volts) / len(volts),
                    'min_v': min(volts),
                    'max_v': max(volts),
                    'avg_b': sum(brights) / len(brights),
                    'min_b': min(brights),
                    'max_b': max(brights),
                    'avg_t': sum(temps) / len(temps),
                    'min_t': min(temps),
                    'max_t': max(temps)
                }
                file_records.append(rec)
                all_raw_data[f] = rows

# 2. 엑셀 워크북 생성
wb = openpyxl.Workbook()

# 스타일 정의
font_title = Font(name="Malgun Gothic", size=14, bold=True, color="1E3A8A")
font_sub = Font(name="Malgun Gothic", size=10, color="64748B")
font_head = Font(name="Malgun Gothic", size=10, bold=True, color="FFFFFF")
font_bold = Font(name="Malgun Gothic", size=10, bold=True)
font_regular = Font(name="Malgun Gothic", size=10)
fill_head = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
fill_head_sub = PatternFill(start_color="334155", end_color="334155", fill_type="solid")
fill_accent = PatternFill(start_color="EFF6FF", end_color="EFF6FF", fill_type="solid")
fill_highlight = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")

align_center = Alignment(horizontal="center", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")

thin_side = Side(style='thin', color='CBD5E1')
thin_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

# ---------------------------------------------------------
# 시트 1: [평균값_요약] (Case A: 파일 번호순 0°~90°)
# ---------------------------------------------------------
ws_sum = wb.active
ws_sum.title = "편광각도별_평균값_요약"

ws_sum.merge_cells("A1:J1")
ws_sum["A1"] = "인천 부광고 태양광 & 편광판 각도별 센서 측정값 평균 분석 (0° ~ 90°)"
ws_sum["A1"].font = font_title
ws_sum["A1"].alignment = align_left
ws_sum.row_dimensions[1].height = 28

ws_sum["A2"] = "* 측정값 (1)~(10) 파일별 60~90개 시계열 데이터의 산술 평균값을 산출하여 편광판 각도차 10도 단위로 매핑한 결과입니다."
ws_sum["A2"].font = font_sub
ws_sum.row_dimensions[2].height = 18

headers = [
    "각도차(Δθ, °)",
    "해당 파일명",
    "측정 횟수(N)",
    "평균 전압(V)",
    "전압 범위(Min~Max)",
    "평균 밝기(Lux)",
    "밝기 범위(Min~Max)",
    "평균 온도(°C)",
    "정규화 밝기비(%)",
    "비고 (말뤼스 이론 대비)"
]

ws_sum.row_dimensions[4].height = 24
for col_idx, h in enumerate(headers, start=1):
    c = ws_sum.cell(row=4, column=col_idx, value=h)
    c.font = font_head
    c.fill = fill_head
    c.alignment = align_center
    c.border = thin_border

# 기준 밝기 (0도 측정값의 밝기)
base_b = file_records[0]['avg_b']

for idx, rec in enumerate(file_records):
    row_num = 5 + idx
    angle = (rec['num'] - 1) * 10
    norm_ratio = (rec['avg_b'] / base_b) * 100
    
    note = ""
    if angle == 0:
        note = "기준 (0° 평행 투과)"
    elif angle == 90:
        note = "90° 직교 차단 지점"
    
    ws_sum.row_dimensions[row_num].height = 20
    ws_sum.cell(row=row_num, column=1, value=f"{angle}°").alignment = align_center
    ws_sum.cell(row=row_num, column=2, value=rec['file']).alignment = align_center
    ws_sum.cell(row=row_num, column=3, value=rec['count']).alignment = align_center
    
    cv = ws_sum.cell(row=row_num, column=4, value=round(rec['avg_v'], 3))
    cv.alignment = align_right
    cv.number_format = "0.000"
    
    ws_sum.cell(row=row_num, column=5, value=f"{rec['min_v']:.2f} ~ {rec['max_v']:.2f}").alignment = align_center
    
    cb = ws_sum.cell(row=row_num, column=6, value=round(rec['avg_b'], 1))
    cb.alignment = align_right
    cb.number_format = "#,##0.0"
    
    ws_sum.cell(row=row_num, column=7, value=f"{rec['min_b']:.0f} ~ {rec['max_b']:.0f}").alignment = align_center
    
    ct = ws_sum.cell(row=row_num, column=8, value=round(rec['avg_t'], 1))
    ct.alignment = align_right
    ct.number_format = "0.0"
    
    cn = ws_sum.cell(row=row_num, column=9, value=round(norm_ratio, 1))
    cn.alignment = align_right
    cn.number_format = "0.0"
    
    ws_sum.cell(row=row_num, column=10, value=note).alignment = align_left

    for c in range(1, 11):
        ws_sum.cell(row=row_num, column=c).font = font_regular
        ws_sum.cell(row=row_num, column=c).border = thin_border
        if angle == 0 or angle == 90:
            ws_sum.cell(row=row_num, column=c).fill = fill_highlight

# 컬럼 폭 자동 조정
col_widths = [14, 18, 14, 14, 20, 16, 20, 14, 16, 25]
for col_idx, w in enumerate(col_widths, start=1):
    ws_sum.column_dimensions[get_column_letter(col_idx)].width = w

# ---------------------------------------------------------
# 시트 2: [시간순_측정_정렬] (Case B)
# ---------------------------------------------------------
ws_time = wb.create_sheet(title="실험시간순_정렬_비교")
ws_time.merge_cells("A1:I1")
ws_time["A1"] = "측정 타임스탬프 순서 정렬 (실제 실험 측정 순서)"
ws_time["A1"].font = font_title
ws_time.row_dimensions[1].height = 26

time_sorted = sorted(file_records, key=lambda x: x['timestamp'])

ws_time.row_dimensions[3].height = 24
headers_time = ["측정 순서", "측정 시각", "파일명", "평균 전압(V)", "평균 밝기", "평균 온도(°C)", "데이터 수", "전압 최소~최대", "밝기 최소~최대"]
for col_idx, h in enumerate(headers_time, start=1):
    c = ws_time.cell(row=3, column=col_idx, value=h)
    c.font = font_head
    c.fill = fill_head_sub
    c.alignment = align_center
    c.border = thin_border

for idx, rec in enumerate(time_sorted, start=1):
    row_num = 3 + idx
    ws_time.row_dimensions[row_num].height = 20
    ts_formatted = f"{rec['timestamp'][:2]}:{rec['timestamp'][2:4]}:{rec['timestamp'][4:]}"
    ws_time.cell(row=row_num, column=1, value=f"{idx}회차").alignment = align_center
    ws_time.cell(row=row_num, column=2, value=ts_formatted).alignment = align_center
    ws_time.cell(row=row_num, column=3, value=rec['file']).alignment = align_center
    
    cv = ws_time.cell(row=row_num, column=4, value=round(rec['avg_v'], 3))
    cv.alignment = align_right
    cv.number_format = "0.000"
    
    cb = ws_time.cell(row=row_num, column=5, value=round(rec['avg_b'], 1))
    cb.alignment = align_right
    cb.number_format = "#,##0.0"
    
    ct = ws_time.cell(row=row_num, column=6, value=round(rec['avg_t'], 1))
    ct.alignment = align_right
    ct.number_format = "0.0"
    
    ws_time.cell(row=row_num, column=7, value=rec['count']).alignment = align_center
    ws_time.cell(row=row_num, column=8, value=f"{rec['min_v']:.2f} ~ {rec['max_v']:.2f}").alignment = align_center
    ws_time.cell(row=row_num, column=9, value=f"{rec['min_b']:.0f} ~ {rec['max_b']:.0f}").alignment = align_center

    for c in range(1, 10):
        ws_time.cell(row=row_num, column=c).font = font_regular
        ws_time.cell(row=row_num, column=c).border = thin_border

time_widths = [12, 14, 18, 14, 14, 14, 12, 20, 20]
for col_idx, w in enumerate(time_widths, start=1):
    ws_time.column_dimensions[get_column_letter(col_idx)].width = w

# 엑셀 저장
output_path = "측정값_평균_분석결과.xlsx"
wb.save(output_path)
print(f"엑셀 파일 생성 완료: {output_path}")
