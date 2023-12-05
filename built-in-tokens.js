// This should be pulled from the cloud somewhere instead of bundled in the extension
const builtInTokens = [
  {
    "name": "Blood",
    "folderPath": "/Overlays",
    "image": "https://drive.google.com/file/d/1frTuvq-64DA23ayC6P0XGZyo0M6paEID/view?usp=sharing",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Big Bang",
    "folderPath": "/Overlays",
    "image": "https://drive.google.com/file/d/19pbEuWVSQo15vmlsnJry-q3ordcAlaej/view?usp=sharing",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Fire",
    "folderPath": "/Overlays",
    "image": "https://drive.google.com/file/d/1_wE3B5rvr38cM9NMbCQ__WUf0RIXIuhQ/view?usp=sharing",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Flame 1",
    "folderPath": "/Overlays",
    "image": "https://drive.google.com/file/d/1eWHXQsHloLuocYOuHnvvd0zymZQMH7sm",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Flame 2",
    "folderPath": "/Overlays",
    "image": "https://cutewallpaper.org/21/fire-gif-transparent-background/Fire-PNG-Gif-Transparent-Fire-GifPNG-Images-PlusPNG.gif",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Map Pin",
    "folderPath": "/Overlays",
    "image": "https://drive.google.com/file/d/1excaNtaLfn_Hj5EHuH-h8iimpzC36i0M",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Nebula",
    "folderPath": "/Overlays",
    "image": "https://drive.google.com/file/d/1AeoKU444D3DrtjebegH0yRXNolrqw89K/view?usp=sharing",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Skull",
    "folderPath": "/Overlays",
    "image": "https://drive.google.com/file/d/1of0nmVMh8rnt9pz6iri9gtq-mCQmgCWA",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Star",
    "folderPath": "/Overlays",
    "image": "https://drive.google.com/file/d/1F868fVhQnzFALTcnEIXUDeAl3UKZccKA",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Web",
    "folderPath": "/Overlays",
    "image": "https://drive.google.com/file/d/1rGuD7FMtzy6XR0qcsewndhS33wZL8vEM/view?usp=sharing",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Heartseeker Blade",
    "folderPath": "/Weapons",
    "image": "https://drive.google.com/file/d/1Ft84c1VwnEhwKPew8Yyq8w8NFViC7Mr7/view?usp=sharing",
    "disablestat": true
  },
  {
    "name": "Commoner",
    "folderPath": "/NPCs",
    "image": "https://drive.google.com/file/d/1H-5cCt03oIB43CnhmdaHM6P2Aw8T2n60/view?usp=sharing",
    "alternativeImages": [
      "https://drive.google.com/file/d/1H-5cCt03oIB43CnhmdaHM6P2Aw8T2n60/view?usp=sharing",
      "https://drive.google.com/file/d/14sNpLcJlzOfL4A5Qb_zdrYmOTZk51GTM/view?usp=sharing",
      "https://i.pinimg.com/564x/fa/93/fb/fa93fbf94a90d2068af62b5a34b48d2d.jpg",
      "https://i.pinimg.com/564x/b1/88/10/b18810e3a419fe6c9666ec64c67fdb4f.jpg",
      "https://i.pinimg.com/564x/b1/61/18/b16118b557ed8cd55a72631ff763fa97.jpg",
      "https://i.pinimg.com/564x/f7/6c/e5/f76ce511507ceb4be5003507c4b3190e.jpg",
      "https://i.pinimg.com/564x/d5/9b/e6/d59be622749ea74ccbc88485783e679c.jpg",
      "https://i.pinimg.com/564x/55/22/96/55229604ec385c8c1bf442a187a3aeeb.jpg",
      "https://i.pinimg.com/564x/da/56/f5/da56f50ba711df5b7c80e2fc240d9786.jpg",
      "https://i.pinimg.com/236x/62/45/8e/62458effd9b3901aa220954d50410988.jpg",
      "https://i.pinimg.com/236x/dc/39/e3/dc39e3e0edf1204d128565084146e221.jpg",
      "https://i.pinimg.com/236x/5a/13/5f/5a135f30617868eb35a78c0c268bd069.jpg",
      "https://i.pinimg.com/236x/6a/e2/51/6ae25147759cdf023dac43cdfeb68ef7.jpg",
      "https://i.pinimg.com/236x/d5/9b/e6/d59be622749ea74ccbc88485783e679c.jpg",
      "https://i.pinimg.com/236x/ec/24/81/ec2481a73c161cbbb70622e485bba1ae.jpg"
    ]
  },
  {
    "name": "Dragonborn [F]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/92aaNuq.png",
    "alternativeImages": [
      "https://i.imgur.com/92aaNuq.png",
      "https://i.imgur.com/4WTK514.png",
      "https://i.imgur.com/vV4mfTo.png",
      "https://i.imgur.com/RdJKUBF.png"
    ]
  },
  {
    "name": "Dragonborn [M]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/0qQpdH6.png",
    "alternativeImages": [
      "https://i.imgur.com/0qQpdH6.png",
      "https://i.imgur.com/EnMudqy.png",
      "https://i.imgur.com/ovnswTE.png",
      "https://i.imgur.com/29uuOXb.png",
      "https://i.imgur.com/Tjyc9Eq.png",
      "https://i.imgur.com/5k3RtNI.png",
      "https://i.imgur.com/YHOfDUc.png",
      "https://i.imgur.com/tQdEaQp.png",
      "https://i.imgur.com/bZZbhFd.png",
      "https://i.imgur.com/qpbahvt.png",
      "https://i.imgur.com/lSZIr0v.png",
      "https://i.imgur.com/Yxd8OuY.png",
      "https://i.imgur.com/Uha5043.png",
      "https://i.imgur.com/87kkYBT.png",
      "https://i.imgur.com/Mu4isFZ.png"
    ]
  },
  {
    "name": "Drow [F]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/lwPqseX.png",
    "alternativeImages": [
      "https://i.imgur.com/lwPqseX.png",
      "https://i.imgur.com/cVaeAum.png",
      "https://i.imgur.com/2qHM12W.png",
      "https://i.imgur.com/apqxuLf.png",
      "https://i.imgur.com/OkdFTrq.png",
      "https://i.imgur.com/W4NtBsW.png",
      "https://i.imgur.com/yoIYDKO.png",
      "https://i.imgur.com/d4baR5O.png",
      "https://i.imgur.com/hpxtRYf.png",
      "https://i.imgur.com/SwxOZEX.png",
      "https://i.imgur.com/wGyXG6h.png",
      "https://i.imgur.com/ZolhnEc.png",
      "https://i.imgur.com/ROnLoAj.png",
      "https://i.imgur.com/PM09pdy.png",
      "https://i.imgur.com/6c8FF5q.png",
      "https://i.imgur.com/aqjKtH5.png",
      "https://i.imgur.com/v49Gd3r.png",
      "https://i.imgur.com/FHMszi4.png",
      "https://i.imgur.com/Lom5T9S.png"
    ]
  },
  {
    "name": "Drow [M]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/RgY5TkF.png",
    "alternativeImages": [
      "https://i.imgur.com/RgY5TkF.png",
      "https://i.imgur.com/RsCAhou.png",
      "https://i.imgur.com/nwAzSyq.png",
      "https://i.imgur.com/aBlbyWo.png",
      "https://i.imgur.com/jEBw3ta.png",
      "https://i.imgur.com/oXyKmyK.png",
      "https://i.imgur.com/4BKZMqc.png",
      "https://i.imgur.com/8TcrJ88.png",
      "https://i.imgur.com/jCWJC1V.png",
      "https://i.imgur.com/WbWzpGq.png",
      "https://i.imgur.com/O6ui3WV.png",
      "https://i.imgur.com/Qr8TXfP.png",
      "https://i.imgur.com/9NuWJG6.png",
      "https://i.imgur.com/2LwVTUr.png"
    ]
  },
  {
    "name": "Dwarf [F]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/4Xuzbp6.png",
    "alternativeImages": [
      "https://i.imgur.com/4Xuzbp6.png",
      "https://i.imgur.com/AmuvYtQ.png",
      "https://i.imgur.com/ZJvqWHQ.png",
      "https://i.imgur.com/eiWM0V7.png",
      "https://i.imgur.com/UED8IzA.png",
      "https://i.imgur.com/BwDRKyr.png"
    ]
  },
  {
    "name": "Dwarf [M]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/T6K1v8s.png",
    "alternativeImages": [
      "https://i.imgur.com/T6K1v8s.png",
      "https://i.imgur.com/7xgLl17.png",
      "https://i.imgur.com/zO45eax.png",
      "https://i.imgur.com/w7KIJiI.png",
      "https://i.imgur.com/G9iZhpX.png",
      "https://i.imgur.com/F2hwQHB.png",
      "https://i.imgur.com/eamn3uD.png",
      "https://i.imgur.com/BSg4egK.png",
      "https://i.imgur.com/WRS4HKH.png",
      "https://i.imgur.com/G6aLVWI.png",
      "https://i.imgur.com/iSz72pl.png",
      "https://i.imgur.com/04X94ln.png",
      "https://i.imgur.com/F5kRG9O.png",
      "https://i.imgur.com/kANojx5.png",
      "https://i.imgur.com/SPQXGob.png",
      "https://i.imgur.com/jhVxT3w.png",
      "https://i.imgur.com/usObgvL.png",
      "https://i.imgur.com/4LUdLCx.png",
      "https://i.imgur.com/78ZtTUn.png"
    ]
  },
  {
    "name": "Elf [F]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/5brExHK.png",
    "alternativeImages": [
      "https://i.imgur.com/5brExHK.png",
      "https://i.imgur.com/97Ssvg7.png",
      "https://i.imgur.com/Ql7WS0c.png",
      "https://i.imgur.com/vv4dBMN.png",
      "https://i.imgur.com/RBJ0P2K.png",
      "https://i.imgur.com/BVyZapA.png",
      "https://i.imgur.com/LyGbTHB.png",
      "https://i.imgur.com/MvxHbId.png",
      "https://i.imgur.com/S2taBOJ.png",
      "https://i.imgur.com/gbu9vUX.png",
      "https://i.imgur.com/6tSIQyq.png",
      "https://i.imgur.com/Y4d6rzn.png",
      "https://i.imgur.com/mo6XKpV.png",
      "https://i.imgur.com/RdTPLng.png",
      "https://i.imgur.com/CBwlgMF.png",
      "https://i.imgur.com/8n7IpwR.png",
      "https://i.imgur.com/rGbRzLw.png",
      "https://i.imgur.com/2Lglcip.png"
    ]
  },
  {
    "name": "Elf [M]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/KhyErAR.png",
    "alternativeImages": [
      "https://i.imgur.com/KhyErAR.png",
      "https://i.imgur.com/bh9ZIeg.png",
      "https://i.imgur.com/K8U1b0h.png",
      "https://i.imgur.com/T3LBvjm.png",
      "https://i.imgur.com/06A68du.png",
      "https://i.imgur.com/DF1dSy7.png",
      "https://i.imgur.com/lG3wpol.png",
      "https://i.imgur.com/JC0VwYz.png",
      "https://i.imgur.com/iNaGb82.png",
      "https://i.imgur.com/w4rZdMx.png",
      "https://i.imgur.com/Eagxsqn.png",
      "https://i.imgur.com/PN7rm5K.png",
      "https://i.imgur.com/vkEGS5t.png",
      "https://i.imgur.com/5cUJo1X.png",
      "https://i.imgur.com/36nKnjL.png",
      "https://i.imgur.com/zzVxVGA.png",
      "https://i.imgur.com/f24uQF7.png",
      "https://i.imgur.com/2d2apvN.png",
      "https://i.imgur.com/ukdo8ds.png",
      "https://i.imgur.com/F9r9k3P.png",
      "https://i.imgur.com/dH30PNn.png",
      "https://i.imgur.com/9zg0eK8.png",
      "https://i.imgur.com/xQ0uII4.png",
      "https://i.imgur.com/Yt6osn6.png",
      "https://i.imgur.com/bNdE7DR.png",
      "https://i.imgur.com/AF3fv3C.png",
      "https://i.imgur.com/j3aX15i.png",
      "https://i.imgur.com/X1GP2WM.png",
      "https://i.imgur.com/v5FHlGi.png",
      "https://i.imgur.com/LfbJzvb.png",
      "https://i.imgur.com/V0rwmIX.png",
      "https://i.imgur.com/hqSP2Rs.png",
      "https://i.imgur.com/MNUuxZj.png",
      "https://i.imgur.com/dl8Vf71.png",
      "https://i.imgur.com/wSofg8Z.png",
      "https://i.imgur.com/mxXCnY1.png",
      "https://i.imgur.com/uwQOjqz.png",
      "https://i.imgur.com/d8FvdaA.png",
      "https://i.imgur.com/b3n8zEv.png",
      "https://i.imgur.com/aiHUW1S.png",
      "https://i.imgur.com/685hEZP.png",
      "https://i.imgur.com/bO5teIc.png",
      "https://i.imgur.com/4sbNTs1.png",
      "https://i.imgur.com/x5PsGUD.png"
    ]
  },
  {
    "name": "Genasi",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/YnlG0US.png",
    "alternativeImages": [
      "https://i.imgur.com/YnlG0US.png",
      "https://i.imgur.com/6TrSNc8.png",
      "https://i.imgur.com/VFn3KwT.png",
      "https://i.imgur.com/B1pH2vd.png",
      "https://i.imgur.com/m9HfCRo.png",
      "https://i.imgur.com/LN9r5Qq.png"
    ]
  },
  {
    "name": "Guard [M]",
    "folderPath": "/NPCs",
    "image": "https://drive.google.com/file/d/1C9ghQrfHckKPOMEHdmStaN47y0OXUPZ9/view?usp=sharing",
    "alternativeImages": [
      "https://drive.google.com/file/d/1C9ghQrfHckKPOMEHdmStaN47y0OXUPZ9/view?usp=sharing"
    ]
  },
  {
    "name": "Human [F]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/NjP2sGL.png",
    "alternativeImages": [
      "https://i.imgur.com/NjP2sGL.png",
      "https://i.imgur.com/H8Q36Zh.png",
      "https://i.imgur.com/RZq8SBK.png",
      "https://i.imgur.com/HHwopfD.png",
      "https://i.imgur.com/XqxVZmK.png",
      "https://i.imgur.com/CPAfuWB.png",
      "https://i.imgur.com/74bpcvT.png",
      "https://i.imgur.com/urg9Qhh.png",
      "https://i.imgur.com/t4yQcY9.png",
      "https://i.imgur.com/eymbYs8.png",
      "https://i.imgur.com/HOgBuYA.png",
      "https://i.imgur.com/FofhAaY.png",
      "https://i.imgur.com/ftlyRz6.png",
      "https://i.imgur.com/ufdYpaw.png",
      "https://i.imgur.com/PZ0UHJV.png",
      "https://i.imgur.com/6Ha5aDY.png",
      "https://i.imgur.com/DOnKbPL.png",
      "https://i.imgur.com/lbxFV6I.png",
      "https://i.imgur.com/2U9nwqu.png",
      "https://i.imgur.com/KcIaDqG.png",
      "https://i.imgur.com/NDNovgG.png",
      "https://i.imgur.com/RZkpx3l.png",
      "https://i.imgur.com/fZKrYaJ.png",
      "https://i.imgur.com/AuXrxtN.png",
      "https://i.imgur.com/tG53u3r.png",
      "https://i.imgur.com/9emKSJI.png"
    ]
  },
  {
    "name": "Human [M]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/vyeBFvg.png",
    "alternativeImages": [
      "https://i.imgur.com/vyeBFvg.png",
      "https://i.imgur.com/iicVOSh.png",
      "https://i.imgur.com/RXQvDzB.png",
      "https://i.imgur.com/yMm3znX.png",
      "https://i.imgur.com/ZLYlstS.png",
      "https://i.imgur.com/E4aNjka.png",
      "https://i.imgur.com/sJodY4T.png",
      "https://i.imgur.com/cfsFqZk.png",
      "https://i.imgur.com/XdXU7mn.png",
      "https://i.imgur.com/GcNRFqx.png",
      "https://i.imgur.com/zVfhSCK.png",
      "https://i.imgur.com/0Hz1O3A.png",
      "https://i.imgur.com/nEh1ufo.png",
      "https://i.imgur.com/6XEUaP5.png",
      "https://i.imgur.com/VSU5NHE.png",
      "https://i.imgur.com/rYyd1h2.png",
      "https://i.imgur.com/07ffel4.png",
      "https://i.imgur.com/pyXlYqe.png",
      "https://i.imgur.com/KS2Hybd.png",
      "https://i.imgur.com/T6v1q7T.png",
      "https://i.imgur.com/juJzfQr.png",
      "https://i.imgur.com/RGzc7aD.png",
      "https://i.imgur.com/9J2iKvp.png",
      "https://i.imgur.com/2SaSS0Y.png",
      "https://i.imgur.com/jJ4c6ba.png",
      "https://i.imgur.com/k7Wx4mJ.png",
      "https://i.imgur.com/Vo1U9cK.png",
      "https://i.imgur.com/LVWkKVI.png",
      "https://i.imgur.com/yMMA82P.png",
      "https://i.imgur.com/f0N2oJa.png",
      "https://i.imgur.com/XJR4m0s.png",
      "https://i.imgur.com/8BKKghq.png",
      "https://i.imgur.com/FBPr0Qx.png",
      "https://i.imgur.com/zPJVZV9.png",
      "https://i.imgur.com/Fxnv4ze.png",
      "https://i.imgur.com/D3MfkZH.png",
      "https://i.imgur.com/fXa8rTq.png",
      "https://i.imgur.com/azyGhw3.png",
      "https://i.imgur.com/QmmV63Y.png",
      "https://i.imgur.com/r84pZVU.png",
      "https://i.imgur.com/qQKIKnR.png",
      "https://i.imgur.com/cDq8Vsr.png",
      "https://i.imgur.com/CbANiCZ.png",
      "https://i.imgur.com/roOhEoe.png",
      "https://i.imgur.com/2cLWc3p.png",
      "https://i.imgur.com/BgvoUWh.png",
      "https://i.imgur.com/PXEx15g.png",
      "https://i.imgur.com/GlG30ko.png",
      "https://i.imgur.com/MilamyO.png",
      "https://i.imgur.com/fnmpif1.png",
      "https://i.imgur.com/LxSkBCv.png",
      "https://i.imgur.com/BDWVEoG.png",
      "https://i.imgur.com/H8gIrL2.png",
      "https://i.imgur.com/Kz31l7I.png",
      "https://i.imgur.com/URuYHUf.png",
      "https://i.imgur.com/jpYQQCi.png",
      "https://i.imgur.com/onBgm22.png",
      "https://i.imgur.com/s86MIgN.png",
      "https://i.imgur.com/AW2altj.png",
      "https://i.imgur.com/gGag3hL.png",
      "https://i.imgur.com/C184k7z.png",
      "https://i.imgur.com/Q2EL6Zo.png",
      "https://i.imgur.com/AqOra0V.png",
      "https://i.imgur.com/NRowLmi.png",
      "https://i.imgur.com/47levai.png",
      "https://i.imgur.com/yDhhssO.png",
      "https://i.imgur.com/1J3nNHm.png",
      "https://i.imgur.com/S1uJBLa.png",
      "https://i.imgur.com/QT918eT.png",
      "https://i.imgur.com/FFLNXSA.png",
      "https://i.imgur.com/98mmYIW.png",
      "https://i.imgur.com/xi7maaE.png",
      "https://i.imgur.com/XBzgh8w.png",
      "https://i.imgur.com/pFW96Y2.png",
      "https://i.imgur.com/d1Cnrja.png",
      "https://i.imgur.com/fHSoonu.png",
      "https://i.imgur.com/UltpGWb.png",
      "https://i.imgur.com/wRUadat.png",
      "https://i.imgur.com/MvMSm3r.png",
      "https://i.imgur.com/eMfk7Zx.png",
      "https://i.imgur.com/yMNo6I9.png",
      "https://i.imgur.com/qjGsNn7.png",
      "https://i.imgur.com/JnJiGoa.png",
      "https://i.imgur.com/ZTSWn3Y.png",
      "https://i.imgur.com/v4F4gjg.png",
      "https://i.imgur.com/gJ9XBJI.png",
      "https://i.imgur.com/D7tMAL2.png",
      "https://i.imgur.com/hEQxRZy.png",
      "https://i.imgur.com/4RZiadV.png",
      "https://i.imgur.com/NYZJ8xP.png",
      "https://i.imgur.com/alANUDw.png",
      "https://i.imgur.com/3pxBGbD.png",
      "https://i.imgur.com/DHfRth2.png",
      "https://i.imgur.com/1bX4Qln.png",
      "https://i.imgur.com/0rzf1SN.png",
      "https://i.imgur.com/DFP9CIA.png",
      "https://i.imgur.com/fBh4m9C.png",
      "https://i.imgur.com/JqhtEZ0.png",
      "https://i.imgur.com/6l2RDlv.png",
      "https://i.imgur.com/FZmdqsr.png"
    ]
  },
  {
    "name": "Maid [F]",
    "folderPath": "/NPCs",
    "image": "https://drive.google.com/file/d/1wB5yKNKQ5dqkLhvWA5UZybLBBTDu-57c/view?usp=sharing",
    "alternativeImages": [
      "https://drive.google.com/file/d/1wB5yKNKQ5dqkLhvWA5UZybLBBTDu-57c/view?usp=sharing"
    ]
  },
  {
    "name": "Orc [F]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/gmUUKun.png",
    "alternativeImages": [
      "https://i.imgur.com/gmUUKun.png",
      "https://i.imgur.com/L0lLPWH.png",
      "https://i.imgur.com/Pwpr4Lp.png",
      "https://i.imgur.com/Zz9cnLt.png"
    ]
  },
  {
    "name": "Orc [M]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/4pWxSUn.png",
    "alternativeImages": [
      "https://i.imgur.com/4pWxSUn.png",
      "https://i.imgur.com/OCrXvMz.png",
      "https://i.imgur.com/DcDsPj1.png",
      "https://i.imgur.com/mSZB6Xi.png",
      "https://i.imgur.com/BjgMrNq.png",
      "https://i.imgur.com/PSoXLYT.png",
      "https://i.imgur.com/W27Ad8q.png",
      "https://i.imgur.com/NChSGAp.png",
      "https://i.imgur.com/l3AOJfN.png",
      "https://i.imgur.com/sKQLsz5.png",
      "https://i.imgur.com/i1taIwb.png"
    ]
  },
  {
    "name": "Tiefling [F]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/r6fKPlI.png",
    "alternativeImages": [
      "https://i.imgur.com/r6fKPlI.png",
      "https://i.imgur.com/gbs56aT.png",
      "https://i.imgur.com/LL8SD3k.png",
      "https://i.imgur.com/7gBPY82.png",
      "https://i.imgur.com/YjAMYM1.png",
      "https://i.imgur.com/dP9wszv.png",
      "https://i.imgur.com/HtsCPgu.png",
      "https://i.imgur.com/n2nb2NL.png",
      "https://i.imgur.com/STNSgme.png",
      "https://i.imgur.com/4iZmAAl.png",
      "https://i.imgur.com/LcPOA39.png",
      "https://i.imgur.com/xDTDx7I.png",
      "https://i.imgur.com/PyecEQG.png",
      "https://i.imgur.com/jRK8fZ6.png",
      "https://i.imgur.com/gPK3Qz7.png",
      "https://i.imgur.com/XwKL0NN.png",
      "https://i.imgur.com/rYc2U8J.png",
      "https://i.imgur.com/jHI0pdZ.png"
    ]
  },
  {
    "name": "Tiefling [M]",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/iLKRQF5.png",
    "alternativeImages": [
      "https://i.imgur.com/iLKRQF5.png",
      "https://i.imgur.com/H6EYE4b.png",
      "https://i.imgur.com/0lzHtWi.png",
      "https://i.imgur.com/6zcM3U9.png",
      "https://i.imgur.com/vLPCfzf.png",
      "https://i.imgur.com/pwuN7KB.png",
      "https://i.imgur.com/8GsL6N4.png",
      "https://i.imgur.com/YKFLCMO.png",
      "https://i.imgur.com/J5FescQ.png",
      "https://i.imgur.com/LHbk4bR.png",
      "https://i.imgur.com/YGs9gP0.png"
    ]
  },
  {
    "name": "Warforged",
    "folderPath": "/NPCs",
    "image": "https://i.imgur.com/N5Nvgkw.png",
    "alternativeImages": [
      "https://i.imgur.com/N5Nvgkw.png",
      "https://i.imgur.com/8K3HZZJ.png",
      "https://i.imgur.com/KrYnmri.png",
      "https://i.imgur.com/JtyrFHx.png",
      "https://i.imgur.com/ApJMypw.png",
      "https://i.imgur.com/2p3WTci.png",
      "https://i.imgur.com/309BYqb.png",
      "https://i.imgur.com/r7my3b6.png",
      "https://i.imgur.com/SVo3VpB.png",
      "https://i.imgur.com/zrN3Vnt.png",
      "https://i.imgur.com/eKfE1AV.png"
    ]
  },
];

[...Array(26).keys()]
    .map(i => (i+10).toString(36).toUpperCase())
    .forEach(letter => {
      builtInTokens.push({
        "name": letter,
        "folderPath": "/Letters",
        "image": `https://abovevtt-assets.s3.eu-central-1.amazonaws.com/letters/${letter}.png`,
        "disableborder": true,
        "auraislight": false
      })
    });
[...Array(99).keys()]
    .forEach(zeroBasedNumber => {
      let number = zeroBasedNumber+1;
      builtInTokens.push({
        "name": `${number}`.padStart(2, "0"),
        "folderPath": "/Numbers",
        "image": `https://abovevtt-assets.s3.eu-central-1.amazonaws.com/numbers/${number}.png`,
        "disableborder": true,
        "auraislight": false
      })
    });
builtInTokens.push({
  "name": `! - Exclamation Mark`,
  "folderPath": "/Letters",
  "image": `https://abovevtt-assets.s3.eu-central-1.amazonaws.com/letters/EXCLAMATION.png`,
  "disableborder": true,
  "auraislight": false
})
builtInTokens.push({
  "name": `? - Question Mark`,
  "folderPath": "/Letters",
  "image": `https://abovevtt-assets.s3.eu-central-1.amazonaws.com/letters/QUESTION.png`,
  "disableborder": true,
  "auraislight": false
})
