from dataclasses import dataclass, field
from typing import Optional

from core.calc import wt, get_band, rate_at, cut_rate, bend_rate, punch_rate, weld_rate, flat_box
from core.nesting import Nest, nest, best_nest
from data.constants import STANDARD_SHEETS, SURFACES, STD_RATES_PER_KG, SURFACES_PER_KG


# ═══════════════════════════════════════════════════════════════
#  §6  QUOTE ENGINE
# ═══════════════════════════════════════════════════════════════

@dataclass
class QLine:
    desc:str; unit:str; qty:float; rate:float; amt:float

@dataclass
class Quote:
    name:str=""; mat:str=""; t:float=0; pl:float=0; pw:float=0; qty:int=1
    weight:float=0; rate_kg:float=0; band_lo:float=0; band_hi:float=0; slider:float=50
    lines:list=field(default_factory=list)
    sub:float=0; overhead:float=0; profit:float=0; per_pc:float=0; total:float=0
    n:Optional[Nest]=None; sheet_cost:float=0; flat_info:str=""
    overhead_pct:float=15; profit_pct:float=20; surface:str="None"

def gen_quote(name,mat,t,pl,pw,qty,slider,cut_m,cut_p,int_c,n_bends,b_len,
              n_holes,h_dia,w_type,w_len,n_spots,surface,oh_pct,pr_pct,
              sheet_n=None,kerf=2,box_h=0,
              hardware=0, stretch_wrap=0, packaging=0,
              apply_punch=False, apply_bend=False, apply_weld=False, apply_pc_dual=False,
              manual_rate=0):
    q = Quote(name=name,mat=mat,t=t,pl=pl,pw=pw,qty=qty,slider=slider,
              overhead_pct=oh_pct,profit_pct=pr_pct,surface=surface)
    lo,hi = get_band(mat,t); q.band_lo=lo; q.band_hi=hi
    # Operator can override the band lookup by entering a rate directly.
    q.rate_kg = float(manual_rate) if manual_rate and float(manual_rate) > 0 \
                else rate_at(mat,t,slider)

    if box_h>0:
        fl,fw,nb,ba,cp = flat_box(pl,pw,box_h,t,mat)
        q.flat_info=f"Box {pl}×{pw}×{box_h} → Flat: {fl}×{fw}mm ({nb} bends, BA={ba}mm)"
        pl,pw=fl,fw; q.pl,q.pw=fl,fw
        if cut_p==0: cut_p=cp
        if n_bends==0: n_bends=nb
        if b_len==0: b_len=pw

    # Material
    w=wt(mat,pl,pw,t); q.weight=w
    mc=w*q.rate_kg; q.lines.append(QLine(f"Material: {mat} {t}mm","kg",w,q.rate_kg,round(mc,2)))

    # Cutting
    tc=(cut_p+int_c)/1000 if (cut_p+int_c)>0 else 2*(pl+pw)/1000
    cr=cut_rate(mat,t,cut_m); q.lines.append(QLine(f"Cutting ({cut_m})","m",round(tc,2),round(cr,2),round(tc*cr,2)))

    # MEPL Standard RM Rate Format: flat ₹/kg of part weight per process.
    # Triggered by checkbox OR a non-zero count in the Operations card.
    if apply_bend or n_bends>0:
        rk=STD_RATES_PER_KG.get("bending",3.0)
        desc = f"Bending ×{n_bends}" if n_bends>0 else "Bending"
        q.lines.append(QLine(desc,"kg",w,rk,round(w*rk,2)))
    if apply_punch or n_holes>0:
        rk=STD_RATES_PER_KG.get("punching",6.0)
        desc = f"Punching ×{n_holes} (Ø{h_dia})" if n_holes>0 else "Punching"
        q.lines.append(QLine(desc,"kg",w,rk,round(w*rk,2)))
    if apply_weld or w_len>0 or n_spots>0:
        rk=STD_RATES_PER_KG.get("welding",4.0)
        parts=[]
        if w_len>0: parts.append(f"{w_type.upper()} {w_len}mm")
        if n_spots>0: parts.append(f"spot ×{n_spots}")
        desc = f"Welding & Fab. ({', '.join(parts)})" if parts else "Welding & Fab."
        q.lines.append(QLine(desc,"kg",w,rk,round(w*rk,2)))
    # Power Coating (Dual Shade) — checkbox OR Surface selection. Only once.
    pc_dual_added = False
    if apply_pc_dual:
        rk=STD_RATES_PER_KG.get("powder_coating_dual",24.80)
        q.lines.append(QLine("Surface: Powder Coating (Dual Shade)","kg",w,rk,round(w*rk,2)))
        pc_dual_added = True
    if surface!="None":
        if surface in SURFACES_PER_KG:
            if not pc_dual_added:
                rk=STD_RATES_PER_KG.get(SURFACES_PER_KG[surface],0)
                q.lines.append(QLine(f"Surface: {surface}","kg",w,rk,round(w*rk,2)))
        else:
            area=(pl/1000)*(pw/1000); sf=SURFACES.get(surface,0)
            q.lines.append(QLine(f"Surface: {surface}","sq.m",round(area,3),sf,round(area*sf,2)))

    # Lot-level extras — distributed per piece so overhead/profit apply uniformly.
    # Displayed with the lot total embedded in the description for clarity.
    for label, lot_cost in [("Hardware / BO", hardware),
                            ("Stretch Wrap Film", stretch_wrap),
                            ("Packaging", packaging)]:
        try:
            lc = float(lot_cost)
        except (TypeError, ValueError):
            lc = 0
        if lc > 0 and qty > 0:
            per_pc = round(lc / qty, 2)
            q.lines.append(QLine(
                f"{label} (₹{lc:,.0f}/lot of {qty})",
                "per pc", 1, per_pc, per_pc))

    q.sub=round(sum(l.amt for l in q.lines),2)
    q.overhead=round(q.sub*oh_pct/100,2)
    q.profit=round((q.sub+q.overhead)*pr_pct/100,2)
    q.per_pc=round(q.sub+q.overhead+q.profit,2)
    q.total=round(q.per_pc*qty,2)

    # Auto nesting
    if sheet_n and sheet_n in STANDARD_SHEETS:
        sl,sw=STANDARD_SHEETS[sheet_n]
        q.n=nest(sl,sw,pl,pw,kerf,qty,sheet_n)
    else:
        q.n=best_nest(pl,pw,kerf,qty)
    if q.n:
        q.sheet_cost=round(wt(mat,q.n.sl,q.n.sw,t)*q.rate_kg,2)
    return q
