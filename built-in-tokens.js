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
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1148091041589756005/flame1.gif",
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
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1083353625113399376/mappin.png",
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
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1083353624652038215/skull.png",
    "disableborder": true,
    "square": true
  },
  {
    "name": "Star",
    "folderPath": "/Overlays",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1083353624891105290/star.png",
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
  {
    "name": "Bandit",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088142509064061009/Bandit_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142509378641920/Bandit_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142509705793609/Bandit_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142509953253376/Bandit_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142510242668635/Bandit_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142510473351218/Bandit_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142510691451042/Bandit_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142510968283216/Bandit_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142511257686076/Bandit_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142511526117467/Bandit_Token_10.png",
    ]
  },
  {
    "name": "Tabaxi",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088142780825620540/Catfolk_Token_7.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142781064691823/Catfolk_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142781316345937/Catfolk_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142781807087774/Catfolk_Token_10.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142782020993145/Catfolk_Token_11.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142782293618788/Catfolk_Token_12.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142782566256750/Catfolk_Token_13.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142782864048238/Catfolk_Token_14.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142783564492865/Catfolk_Token_15.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142783891656756/Catfolk_Token_16.png"
    ]
  },
  {
    "name": "Evil Paladin",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088142973780381736/Dark_Paladin_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142974040408064/Dark_Paladin_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142974266908762/Dark_Paladin_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142974485024870/Dark_Paladin_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142974719885413/Dark_Paladin_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142974946386061/Dark_Paladin_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142975185473608/Dark_Paladin_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142975441305752/Dark_Paladin_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142975709749309/Dark_Paladin_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088142975982370868/Dark_Paladin_Token_10.png"
    ]
  },
  {
    "name": "Demon",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088143205721198772/Demon_Token_14.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143205998014474/Demon_Token_15.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143206279041114/Demon_Token_16.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143206539079790/Demon_Token_17.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143206773952602/Demon_Token_18.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143207008849992/Demon_Token_19.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143207252107285/Demon_Token_20.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143207663161374/Demon_Token_21.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143207952560189/Demon_Token_22.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143208191627274/Demon_Token_23.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143273257865276/Demon_Token_24.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143273517924443/Demon_Token_25.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143273761185852/Demon_Token_26.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143274075754536/Demon_Token_27.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143274302259370/Demon_Token_28.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143274562297946/Demon_Token_29.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143274818146354/Demon_Token_30.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143275103371304/Demon_Token_31.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143275350827099/Demon_Token_32.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143275665395793/Demon_Token_33.png"
    ]
  },
  {
    "name": "Dragon",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088143452308525056/Dragon_Token_9.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143452572749865/Dragon_Token_10.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143452824416407/Dragon_Token_11.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143453231272006/Dragon_Token_12.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143453554216960/Dragon_Token_13.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143453789114418/Dragon_Token_14.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143454044950668/Dragon_Token_15.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143454292430940/Dragon_Token_16.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143454632153119/Dragon_Token_17.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143454867042334/Dragon_Token_18.png"
    ]
  },
  {
    "name": "Druid",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088143587675492464/Druid_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143588006830161/Druid_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143588271083580/Druid_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143588656947220/Druid_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143588908617751/Druid_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143589231566848/Druid_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143589499994122/Druid_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143589764255784/Druid_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143590087204884/Druid_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143590385012786/Druid_Token_10.png"
    ]
  },
  {
    "name": "Dwarf",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088143774150041611/Dwarf_Token_8.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143774636593213/Dwarf_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143775282507796/Dwarf_Token_10.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143775542550639/Dwarf_Token_11.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143775794221096/Dwarf_Token_12.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143776033284106/Dwarf_Token_13.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143776381423716/Dwarf_Token_14.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143776637267988/Dwarf_Token_15.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143776939253780/Dwarf_Token_16.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143777283199026/Dwarf_Token_17.png"
    ]
  },
  {
    "name": "Elemental",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088143904467058788/Elemental_Token_12.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143904727126107/Elemental_Token_13.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143905016512662/Elemental_Token_14.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143905326911598/Elemental_Token_15.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143905603719208/Elemental_Token_16.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143905867956274/Elemental_Token_17.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143906346127481/Elemental_Token_18.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143906614546443/Elemental_Token_19.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143906916532325/Elemental_Token_20.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088143907344371792/Elemental_Token_21.png"
    ]
  },
  {
    "name": "Elf",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088144164761387119/Elven_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144165013041202/Elven_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144165373747250/Elven_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144165709299803/Elven_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144166032253042/Elven_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144166283919360/Elven_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144166527180881/Elven_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144166812401705/Elven_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144167026303066/Elven_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144167345078353/Elven_Token_10.png"
    ]
  },
  {
    "name": "Fighter",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088144423864504453/Fighter_Token_12.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144424095186994/Fighter_Token_13.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144424359444611/Fighter_Token_14.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144424627863673/Fighter_Token_15.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144424913092739/Fighter_Token_16.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144425135378583/Fighter_Token_17.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144425357672539/Fighter_Token_18.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144425567404093/Fighter_Token_19.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144425810661416/Fighter_Token_20.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144426041344071/Fighter_Token_21.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144515883356252/Fighter_Token_35.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144516231467091/Fighter_Token_36.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144516587986984/Fighter_Token_37.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144516902572153/Fighter_Token_38.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144517359734834/Fighter_Token_39.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144517967912990/Fighter_Token_40.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144518450270208/Fighter_Token_41.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144518949376030/Fighter_Token_42.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144519612080168/Fighter_Token_43.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144520174129183/Fighter_Token_44.png"
    ]
  },
  {
    "name": "Goblin",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088144926312775780/Goblin_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144926581207090/Goblin_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144927017402449/Goblin_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144927298437150/Goblin_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144927600410634/Goblin_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144927902416996/Goblin_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144928225374300/Goblin_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144928506380368/Goblin_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144928753860628/Goblin_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088144928984543252/Goblin_Token_10.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145089794162738/Goblin_Token_37.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145090049998920/Goblin_Token_38.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145090381365248/Goblin_Token_39.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145090670764102/Goblin_Token_40.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145090914025492/Goblin_Token_41.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145091224412201/Goblin_Token_42.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145091518005338/Goblin_Token_43.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145091857760347/Goblin_Token_44.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145092105216103/Goblin_Token_45.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145092382031952/Goblin_Token_46.png"
    ]
  },
  {
    "name": "Guard",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088145286775455805/Guards_Token_9.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145287077433415/Guards_Token_10.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145290378354809/Guards_Token_11.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145290730684517/Guards_Token_12.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145291045249155/Guards_Token_13.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145291372412949/Guards_Token_14.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145291628257470/Guards_Token_15.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145291867340830/Guards_Token_16.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145292131569824/Guards_Token_17.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088145292404203550/Guards_Token_18.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146010670379050/Guards_Token_21.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146010892669008/Guards_Token_22.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146011131760640/Guards_Token_23.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146015409942639/Guards_Token_24.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146015632232518/Guards_Token_25.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146015858741278/Guards_Token_26.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146016093614230/Guards_Token_27.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146016315904060/Guards_Token_28.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146016542412871/Guards_Token_29.png"
    ]
  },
  {
    "name": "Knights",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088146163380797570/Knight_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146163632439458/Knight_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146163934449724/Knight_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146164186103828/Knight_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146164412579881/Knight_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146164639092927/Knight_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146164865581200/Knight_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146165243052244/Knight_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146165528285414/Knight_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146165834465444/Knight_Token_10.png"
    ]
  },
  {
    "name": "Kobold",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088146265306579077/Kobold_Token_13.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146265554046996/Kobold_Token_14.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146265843445770/Kobold_Token_15.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146266095108246/Kobold_Token_16.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146266476793876/Kobold_Token_17.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146266715861033/Kobold_Token_18.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146267001077760/Kobold_Token_19.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146267219185684/Kobold_Token_20.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146267458252953/Kobold_Token_21.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146267701526619/Kobold_Token_22.png"
    ]
  },
  {
    "name": "Mage",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088146469778899105/Mage_Token_4.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146470089269248/Mage_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146470412234822/Mage_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146470668091412/Mage_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146471230120087/Mage_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146471976714310/Mage_Token_10.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146472224170044/Mage_Token_11.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146472442282064/Mage_Token_12.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146472744263760/Mage_Token_13.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146552347967559/Mage_Token_15.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146552608006185/Mage_Token_16.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146552838696970/Mage_Token_17.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146553090359406/Mage_Token_18.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146553367175278/Mage_Token_19.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146553589477406/Mage_Token_20.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146553799196682/Mage_Token_21.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146554013098084/Mage_Token_22.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146554227011715/Mage_Token_23.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146554478674070/Mage_Token_24.png"
    ]
  },
  {
    "name": "Orc",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088146755931091036/Orc_Token_10.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146756170162316/Orc_Token_11.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146756459577344/Orc_Token_12.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146756769947668/Orc_Token_13.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146757050974329/Orc_Token_14.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146757361344713/Orc_Token_15.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146757650759781/Orc_Token_16.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146757940158566/Orc_Token_17.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146758204407839/Orc_Token_18.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146758506389645/Orc_Token_19.png"
    ]
  },
  {
    "name": "Paladin",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088146888341082132/Paladin_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146888571760732/Paladin_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146888806645790/Paladin_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146889058308186/Paladin_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146889305763921/Paladin_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146889507094618/Paladin_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146889746173972/Paladin_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146890006212649/Paladin_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146890236903494/Paladin_Token_9.png"
    ]
  },
  {
    "name": "Pirate",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088146986097717408/Pirate_Token_3.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146986315829378/Pirate_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146986546499724/Pirate_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146986802360371/Pirate_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146987037249696/Pirate_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146987297280000/Pirate_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146987523784744/Pirate_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146987754475661/Pirate_Token_10.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146987985145967/Pirate_Token_11.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088146988261978242/Pirate_Token_12.png"
    ]
  },
  {
    "name": "Rabbitfolk",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088147118461571202/Rabbitfolk_Token_5.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147118759354409/Rabbitfolk_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147119057154119/Rabbitfolk_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147119338180668/Rabbitfolk_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147119568855070/Rabbitfolk_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147119870849114/Rabbitfolk_Token_10.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147120147681330/Rabbitfolk_Token_11.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147120403521547/Rabbitfolk_Token_12.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147120671961138/Rabbitfolk_Token_13.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147120915238984/Rabbitfolk_Token_14.png"
    ]
  },
  {
    "name": "Ranger",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088147259499216916/Ranger_Token_2.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147259876712591/Ranger_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147260367458334/Ranger_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147260682010624/Ranger_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147261013381212/Ranger_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147261441179719/Ranger_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147261688651867/Ranger_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147262074519584/Ranger_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147262439432262/Ranger_Token_10.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147262749823077/Ranger_Token_11.png"
    ]
  },
  {
    "name": "Rogue",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088147333595807867/Rogue_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147333881024562/Rogue_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147334136873000/Rogue_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147334371758180/Rogue_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147334598242344/Rogue_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147334883459133/Rogue_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147335214805164/Rogue_Token_7.png"
    ]
  },
  {
    "name": "Samurai",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088147435655807026/Samurai_Token_1.png",
  },
  {
    "name": "Sorceror",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088147601343393873/Sorcerer_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147601670541405/Sorcerer_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147601947377754/Sorcerer_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147602211614780/Sorcerer_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147602484248587/Sorcerer_Token_5.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147602819780708/Sorcerer_Token_6.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147603285360720/Sorcerer_Token_7.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147603721564300/Sorcerer_Token_8.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147604002574499/Sorcerer_Token_9.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147604405235812/Sorcerer_Token_10.png"
    ]
  },
  {
    "name": "Trollkin",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088147760177496065/Trollkin_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147760441733221/Trollkin_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147760689201272/Trollkin_Token_3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147760986980402/Trollkin_Token_4.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088147761280598179/Trollkin_Token_5.png"
    ]
  },
  {
    "name": "Skeleton",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088148088763457656/Skeleton_Token_17.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148088973168710/Skeleton_Token_18.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148089229033604/Skeleton_Token_19.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148089455517726/Skeleton_Token_20.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148089669423124/Skeleton_Token_21.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148089879150682/Skeleton_Token_22.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148090134994995/Skeleton_Token_23.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148090361483475/Skeleton_Token_24.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148090617348156/Skeleton_Token_25.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148090906746890/Skeleton_Token_26.png"
    ]
  },
  {
    "name": "Commoner",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088148208242413739/Villager_Token_1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148208552779836/Villager_Token_2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148208846393424/Villager_Token_3.png"
    ]
  },
  {
    "name": "Human",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088148938961461299/HumanDruid.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148939175366666/HumanExplorer.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148939397677086/HumanFighter.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148939611578478/HumanMan10.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148939875815434/HumanMonk.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148940177817630/HumanRanger2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148940429467721/HumanRogueWoman01.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088148940706299984/HumanWizard.png"
    ]
  },
  {
    "name": "Necromancer",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088149022327451658/Necromancer1.png"
  },
  {
    "name": "Merchant",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088149110747566281/MerchantLord.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088149111024406630/merchanttoken.png"
    ]
  },
  {
    "name": "Noble",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088149195841601566/nobleman1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088149196323958895/NobleWoman1.png"
    ]
  },
  {
    "name": "Priest",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088149279073386586/oldpriest.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088149279295688856/oldpriest1.png"
    ]
  },
  {
    "name": "Sailor",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088151412170575902/Sailor1Token.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151412422213694/Sailor2Token.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151412732612669/Sailor3Token.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151413005221888/Sailor4Token.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151413286260856/Sailor5Token.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151413542092805/Sailor6Token.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151413776986282/Sailor7Token.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151414007681125/Sailor8Token.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151414208987166/Sailor9Token.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151414443888650/Sailor10Token.png"
    ]
  },
  {
    "name": "Sorceress",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088151512582213642/Sorceress1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151512829657118/Sorceress2.png"
    ]
  },
  {
    "name": "Bard",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088151598070513764/SomeBard.png"
  },
  {
    "name": "Thug",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088151695323828325/Thug01.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151695550328832/Thug02.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151695835529256/Thug03.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151696099774576/Thug04.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151696313692201/Thug05.png"
    ]
  },
  {
    "name": "Warforged (color)",
    "folderPath": "/Midjourney",
    "image": "https://cdn.discordapp.com/attachments/1083353621778923581/1088151888983244922/Warforged1.png",
    "alternativeImages": [
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151889310392320/Warforged2.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151889595600957/Warforged3.png",
      "https://cdn.discordapp.com/attachments/1083353621778923581/1088151889981481030/Warforged4.png"
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
