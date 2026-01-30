import { get_scene_data_bgdia } from './bgdia-scene-data.js';
import { get_scene_data_doip } from './doip-scene-data.js';
import { get_scene_data_lmop } from './lmop-scene-data.js';
import { get_scene_data_loe } from './loe-scene-data.js';
import { get_scene_data_pbtso } from './pbtso-scene-data.js';
import { get_scene_data_toa } from './toa-scene-data.js';
import { get_scene_data_tod } from './tod-scene-data.js';
import { get_scene_data_veor } from './veor-scene-data.js';
import { get_scene_data_hcs } from './hcs-scene-data.js';
import { get_scene_data_dosi } from './dosi-scene-data.js';
import { get_scene_data_sdw } from './sdw-scene-data.js';
import { get_scene_data_hgtmh1 } from './hgtmh1-scene-data.js';
import { get_scene_data_dilct } from './dilct-scene-data.js';
import { get_scene_data_uhlh } from './uhlh-scene-data.js';
import { get_scene_data_gotsf } from './gotsf-scene-data.js';
import { get_scene_data_gos } from './gos-scene-data.js';
import { get_scene_data_hbtd } from './hbtd-scene-data.js';
import { get_scene_data_ottg } from './ottg-scene-data.js';
import { get_scene_data_wel } from './wel-scene-data.js';
import { get_scene_data_hotb } from './hotb-scene-data.js';
import { get_scene_data_tftyp } from './tftyp-scene-data.js';
import { get_scene_data_misc } from './misc-scene-data.js';
import { get_scene_data_skt } from './skt-scene-data.js';

//TO DO: Split this out so it only loads whats needed based on current chapter loading 
const get_ddb_extras = {
        ...get_scene_data_misc,
        ...get_scene_data_skt,
        ...get_scene_data_bgdia,
        ...get_scene_data_doip,
        ...get_scene_data_lmop,
        ...get_scene_data_loe,
        ...get_scene_data_pbtso,
        ...get_scene_data_toa,
        ...get_scene_data_tod,
        ...get_scene_data_veor,
        ...get_scene_data_hcs,
        ...get_scene_data_dosi,
        ...get_scene_data_sdw,
        ...get_scene_data_hgtmh1,
        ...get_scene_data_dilct,
        ...get_scene_data_uhlh,
        ...get_scene_data_gotsf,
        ...get_scene_data_gos,
        ...get_scene_data_hbtd,
        ...get_scene_data_ottg,
        ...get_scene_data_wel,
        ...get_scene_data_hotb,
        ...get_scene_data_tftyp
    }


export { get_ddb_extras }


