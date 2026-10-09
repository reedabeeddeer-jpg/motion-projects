"""Calm ambient score (10 s): warm pad + soft bell notes + light reverb. Pure numpy -> WAV."""
import numpy as np, wave
SR=44100; D=10.0; n=int(SR*D); t=np.arange(n)/SR
rng=np.random.default_rng(7)
hz=lambda m:440*2**((m-69)/12)
def env(t0,t1,a,r):               # soft attack / release envelope
    e=np.zeros(n); i0,i1=int(t0*SR),min(int(t1*SR),n)
    x=np.arange(i1-i0)/SR; L=(t1-t0)
    e[i0:i1]=np.minimum(1,x/a)*np.minimum(1,(L-x)/r); return np.clip(e,0,1)
def pad(notes,t0,t1):
    s=np.zeros(n)
    for m in notes:
        for det in (-6,0,5):       # detuned sines + 2nd harmonic = warm, slow-chorused pad
            f=hz(m)*2**(det/1200)
            s+=np.sin(2*np.pi*f*t+rng.uniform(0,6))+0.25*np.sin(2*np.pi*2*f*t)
    return s*env(t0,t1,1.8,2.2)/ (len(notes)*3)
# D minor -> Bb major -> F major -> A minor-ish (slow, hopeful)
x=pad([50,57,62,65,69],0,3.6)+pad([46,53,58,62,65],2.6,6.2)+pad([53,57,60,64,69],5.2,8.4)+pad([45,57,60,64,67],7.4,10.4)
x*=0.55
def bell(m,t0,amp=1.0,dec=2.2):
    f=hz(m); tt=np.clip(t-t0,0,None); e=np.where(t>=t0,np.exp(-tt/dec*2.2),0)*np.minimum(1,tt/0.01)
    return amp*e*(np.sin(2*np.pi*f*t)+0.35*np.sin(2*np.pi*2.0*f*t)+0.12*np.sin(2*np.pi*3.01*f*t))
# sparse melody: rising notes follow the letters climbing (~1-4 s), then it settles
mel=[(1.0,74),(1.7,77),(2.4,81),(3.0,79),(3.5,81),(4.0,84),(5.2,81),(6.4,77),(7.6,74)]
b=sum(bell(m,t0,0.18) for t0,m in mel)
x+=b
# light reverb: exponentially decaying noise impulse response via FFT convolution
ir=rng.standard_normal(int(SR*2.2))*np.exp(-np.arange(int(SR*2.2))/SR*2.4); ir[:200]=0
N=1<<int(np.ceil(np.log2(n+len(ir))))
wet=np.fft.irfft(np.fft.rfft(x,N)*np.fft.rfft(ir,N),N)[:n]; wet/=np.abs(wet).max()+1e-9
x=0.62*x/np.abs(x).max()+0.32*wet
x*=np.minimum(1,t/1.0)*np.minimum(1,(D-t)/1.4)      # fade in / out
x=0.85*x/np.abs(x).max()
st=np.stack([x,np.roll(x,int(0.012*SR))],1)          # slight stereo width
with wave.open('music.wav','wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((st*32767).astype('<i2').tobytes())
