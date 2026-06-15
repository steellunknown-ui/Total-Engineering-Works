import math
from dataclasses import dataclass
from data.constants import STANDARD_SHEETS


# ═══════════════════════════════════════════════════════════════
#  §4  NESTING
# ═══════════════════════════════════════════════════════════════

@dataclass
class Nest:
    name:str=""; sl:float=0; sw:float=0; pl:float=0; pw:float=0; kerf:float=2
    normal:int=0; rotated:int=0; mixed:int=0
    best:int=0; orient:str=""; util:float=0; waste:float=0
    sheets:int=0; qty:int=0

def nest(sl,sw,pl,pw,kerf=2,qty=1,name=""):
    r = Nest(name=name,sl=sl,sw=sw,pl=pl,pw=pw,kerf=kerf,qty=qty)
    el,ew = pl+kerf, pw+kerf
    cn,rn = int(sl//el), int(sw//ew); r.normal=cn*rn
    cr,rr = int(sl//ew), int(sw//el); r.rotated=cr*rr
    mx1=r.normal; ll=sl-cn*el
    if ll>=ew and sw>=el: mx1+=int(ll//ew)*int(sw//el)
    mx2=r.rotated; ll2=sl-cr*ew
    if ll2>=el and sw>=ew: mx2+=int(ll2//el)*int(sw//ew)
    r.mixed=max(mx1,mx2)
    opts={"Normal":r.normal,"Rotated 90°":r.rotated,"Mixed":r.mixed}
    bk=max(opts,key=opts.get); r.best=opts[bk]; r.orient=bk
    sa=sl*sw
    if sa>0 and r.best>0:
        r.util=round(r.best*pl*pw/sa*100,1); r.waste=round(100-r.util,1)
    r.sheets=math.ceil(qty/r.best) if r.best>0 else 0
    return r

def best_nest(pl,pw,kerf=2,qty=1):
    best_r,best_u=None,0
    for n,(sl,sw) in STANDARD_SHEETS.items():
        r=nest(sl,sw,pl,pw,kerf,qty,n)
        if r.util>best_u: best_u=r.util; best_r=r
    return best_r
