import math
from data.constants import DENSITY, RATE_BANDS, K_FACTOR, OP_MULT


# ═══════════════════════════════════════════════════════════════
#  §3  CALCULATIONS
# ═══════════════════════════════════════════════════════════════

def wt(mat,l,w,t): return round((l/1000)*(w/1000)*(t/1000)*DENSITY.get(mat,7850),3)

def get_band(mat,t):
    for tt,lo,hi in RATE_BANDS.get(mat,[]):
        if abs(tt-t)<0.01: return lo,hi
    return 55,70

def rate_at(mat,t,pct):
    lo,hi = get_band(mat,t)
    return round(lo+(hi-lo)*pct/100, 2) if (lo+hi)>0 else 0

def tcat(t):
    if t<=1.5: return "thin"
    if t<=4: return "medium"
    if t<=12: return "thick"
    return "heavy"

def cut_rate(mat,t,method="laser"):
    b = {"laser":{"thin":15,"medium":35,"thick":80,"heavy":150},
         "plasma":{"thin":10,"medium":20,"thick":40,"heavy":70},
         "waterjet":{"thin":40,"medium":60,"thick":90,"heavy":130},
         "shearing":{"thin":5,"medium":10,"thick":20,"heavy":40}}
    return b.get(method,b["laser"])[tcat(t)] * OP_MULT.get(mat,1)

def bend_rate(mat,t,blen):
    for lim,val in [(1.5,20),(4,45),(8,90),(16,180)]:
        if t<=lim: return val*max(1,blen/1000)*OP_MULT.get(mat,1)
    return 350*max(1,blen/1000)*OP_MULT.get(mat,1)

def punch_rate(mat,t,dia):
    for lim,val in [(2,3),(6,8),(12,18)]:
        if t<=lim: return val*max(1,dia/10)*OP_MULT.get(mat,1)
    return 35*max(1,dia/10)*OP_MULT.get(mat,1)

def weld_rate(mat,t,wt_type="mig"):
    b = {"mig":{"thin":30,"medium":55,"thick":100,"heavy":180},
         "tig":{"thin":60,"medium":100,"thick":180,"heavy":300},
         "arc":{"thin":20,"medium":40,"thick":75,"heavy":140},
         "spot":{"thin":8,"medium":15,"thick":25,"heavy":45}}
    return b.get(wt_type,b["mig"])[tcat(t)] * OP_MULT.get(mat,1)

def flat_box(l,w,h,t,mat):
    if h<=0: return l,w,0,0,round(2*(l+w),2)
    k = K_FACTOR.get(mat,0.33)
    ba = math.radians(90)*(t+k*t)
    fl = h+ba+l+ba+h; fw = h+ba+w+ba+h
    return round(fl,2),round(fw,2),4,round(ba,2),round(2*(fl+fw),2)
