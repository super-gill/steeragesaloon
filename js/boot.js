/* ================= LOADER (0.38.0) =================
   index.html fetches this file fresh on every load (it adds the time to the address), and this file then loads the style
   sheet and every script at the version named here. A browser that keeps an old copy of index.html can therefore never
   mix old and new scripts: before 0.38.0 the version strings lived in index.html itself, so a cached page could load
   last week's economy.js beside this week's sim.js and fail with "Can't find variable". Bump BOOT_VER with GAME_VERSION
   (tools/lint.js checks they agree). tools/build-single.py reads BOOT_FILES to bundle the same files in the same order. */
var BOOT_VER='0.39.1';
var BOOT_FILES=['chart-data','data','helpers','economy','lanes','wireless','silent','emergency','disaster','livery','war','ledger','sim','rivals','companies','outside','trust','prewar','market','float','moves','yard','naval','facilities','crew','fleetmgr','state','clock','map','profile','advice','design','tutorial','times','devlog','ui','main'];
function bootStyles(){document.write('<link rel="stylesheet" href="css/style.css?v='+BOOT_VER+'">');}
function bootScripts(){for(var i=0;i<BOOT_FILES.length;i++)document.write('<script src="js/'+BOOT_FILES[i]+'.js?v='+BOOT_VER+'"><\/script>');}
bootStyles();
