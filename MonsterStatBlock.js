
function build_and_display_stat_block_with_id(monsterId, container, tokenId, callback, open5e=false) {


    let cachedMonsterItem = open5e ? cached_open5e_items[monsterId] : cached_monster_items[monsterId];
    if (cachedMonsterItem) {
      display_stat_block_in_container(new MonsterStatBlock(cachedMonsterItem.monsterData), container, tokenId);
      if (callback) {
          callback();
      }
    } else {
        fetch_and_cache_monsters([monsterId], function (open5e = false) {
            if(!open5e){

              display_stat_block_in_container(new MonsterStatBlock(cached_monster_items[monsterId].monsterData), container, tokenId);
            }
            else{
              display_stat_block_in_container(new MonsterStatBlock(cached_open5e_items[monsterId].monsterData), container, tokenId);
            }
            if (callback) {
                callback();
            }
        }, open5e);
    }
}

function build_and_display_stat_block_with_data(monsterData, container, tokenId, open5e=false) {
    let cachedMonsterItem = cached_monster_items[monsterData.id];
    if (cachedMonsterItem) {
        // we have a cached monster. this data is the best data we have so display that instead of whatever we were given
        display_stat_block_in_container(new MonsterStatBlock(cachedMonsterItem.monsterData), container, tokenId);
    } else {
        // the monster data that we get from searching monsters (everything in the sidebar)
        // is not as good as the data we get from fetching the monster directly so
        // build with what the listItem has on it, then fetch more details, then re-render it with the updated details
        display_stat_block_in_container(new MonsterStatBlock(monsterData), container, tokenId);
        let monsterId = (monsterData.key) ? monsterData.key : monsterData.id
        fetch_and_cache_monsters([monsterId], function (open5e = false) {
          if(!open5e){
            display_stat_block_in_container(new MonsterStatBlock(cached_monster_items[monsterId].monsterData), container, tokenId);
          }
          else{
            display_stat_block_in_container(new MonsterStatBlock(cached_open5e_items[monsterId].monsterData), container, tokenId);
          }
        }, open5e);
    }
}

function build_stat_block_for_copy(listItem, options, open5e = false){
  const monsterData = listItem.monsterData;
  const monsterId = open5e == true ? monsterData.key : monsterData.id
  const cachedMonsterItem = open5e == true ? cached_open5e_items[monsterId] : cached_monster_items[monsterId];
  build_import_loading_indicator('Fetching Statblock Info');
  if (cachedMonsterItem) {
      // we have a cached monster. this data is the best data we have so display that instead of whatever we were given
    create_token_inside(find_sidebar_list_item_from_path(RootFolder.MyTokens.path), undefined, undefined, undefined, options, build_monster_copy_stat_block(new MonsterStatBlock(cachedMonsterItem.monsterData)));
    $(".import-loading-indicator").remove();
  } else {
    fetch_and_cache_monsters([monsterId], function (open5e = false) {
        if(!open5e){
          create_token_inside(find_sidebar_list_item_from_path(RootFolder.MyTokens.path), undefined, undefined, undefined, options, build_monster_copy_stat_block(new MonsterStatBlock(cached_monster_items[monsterId].monsterData)));
        }
        else{
          create_token_inside(find_sidebar_list_item_from_path(RootFolder.MyTokens.path), undefined, undefined, undefined, options, build_monster_copy_stat_block(new MonsterStatBlock(cached_open5e_items[monsterId].monsterData)));
        }
      $(".import-loading-indicator").remove();
    }, open5e);
  }  
}

async function display_stat_block_in_container(statBlock, container, tokenId, customStatBlock = undefined) {
    const token = window.TOKEN_OBJECTS[tokenId];
    let $html = (customStatBlock) ? $(`<div class="container avtt-stat-block-container custom-stat-block" data-stat-id="${window.TOKEN_OBJECTS[tokenId].options.statBlock}" data-token-id="${tokenId}">${customStatBlock}</div>`) : $(await build_monster_stat_block(statBlock, token));
    container.find("#noAccessToContent").remove(); // in case we're re-rendering with better data
    container.find(".avtt-stat-block-container").remove(); // in case we're re-rendering with better data
    container.append($html);
    if(customStatBlock || statBlock.data?.open5e == true){
      $(container).find('.injected-input, .added-input-desc').remove();
      $(container).find('.add-input:not(.avtt-custom-tracker)').replaceWith((i, innerHtml) => {
        return innerHtml;
      })
      await window.JOURNAL.translateHtmlAndBlocks($html);
      add_journal_roll_buttons($html, tokenId);
     
      $(container).find('.add-input').each(function(){window.JOURNAL.addTrackedInputs($(this), {token})});
    }
    window.JOURNAL.add_journal_tooltip_targets($html);
    if(customStatBlock){
      let imageUrl = parse_img(token.options.imgsrc);

      if(token.options.imgsrc.startsWith('above-bucket-not-a-url')){
        imageUrl = await getAvttStorageUrl(imageUrl);
      }
      //todo: evaluate block -> inline-block change here.
      container.find(`.avtt-stat-block-container`).append(`<div class="image" style="display: inline-block; position: relative;"><${(token.options.videoToken == true || ['.mp4', '.webm', '.m4v'].some(d => token.options.imgsrc.includes(d))) ? 'video disableremoteplayback muted' : 'img'}
            src="${imageUrl}"    
            class="monster-image"
            style="max-width: 100%;">
            </div>`);    


      const customStatId = token.options.statBlock;


      container.off('focusout.editable').on('focusout.editable', '.dnd-sheet [contenteditable="true"]', (e)=>{
        if($('[contenteditable="true"] :is(:focus, :focus-within)').length>0) return;
        if($(e.target).is('.injected-input')) return;  
        const note_text = container.find('.avtt-stat-block-container').first();
				const closestNote = note_text.clone(true, true);
				const avttImages = closestNote.find('img[data-src*="above-bucket-not-a-url"]');
				avttImages.attr('src', '');
				avttImages.attr('href', '');
        closestNote.find('a:empty, button:empty, .image, .add-table-row').remove();
        const noteButtons = closestNote.find('button');
				noteButtons.replaceWith((i, innerHTML)=>{
          const command = noteButtons[i].getAttribute('data-slash-command');
					if(command){
						innerHTML = `[roll]${command}[/roll]`
					}
          return innerHTML;
        })
        closestNote.find('.abovevtt-slash-command-journal').replaceWith((i, innerHTML) =>{
					return innerHTML;
				})
        const sanitizedHTML = basic_sanitize_html(closestNote[0].innerHTML).replaceAll(/\[(\/)?spell\]/gi, `[$1spell]`).replaceAll(/\[(\/)?magicitem\]/gi, `[$1magicItem]`).replaceAll(/\[(\/)?item\]/gi, `[$1item]`);
				
        const changes = $(sanitizedHTML).text().replace(/[\s\n\r]/gi, '') != window.JOURNAL.notes[customStatId].plain.replace(/[\s\n\r]/gi, '');
        if(changes){
          window.JOURNAL.notes[customStatId].text = sanitizedHTML; 
          window.JOURNAL.notes[customStatId].plain = $(sanitizedHTML).text();
          debounceSendNote(customStatId, window.JOURNAL.notes[customStatId], tokenId);
          window.JOURNAL.setPersistTimeout();
          debounceRescanStatBlock(container, customStatId, tokenId);
        }

			});
			container.off('change.checkbox').on('change.checkbox', '.dnd-sheet input', (e)=>{
				if (e.target && e.target.nodeName === 'INPUT' && e.target.type === 'checkbox') {				
					if (e.target.checked) {
						e.target.setAttribute('checked', 'checked');
					} else {
						e.target.removeAttribute('checked');
					}
				}
        const note_text = container.find('.avtt-stat-block-container').first();
				const closestNote = note_text.clone(true, true);
				const avttImages = closestNote.find('img[data-src*="above-bucket-not-a-url"]');
				avttImages.attr('src', '');
				avttImages.attr('href', '');
        closestNote.find('a:empty, button:empty, .image, .add-table-row').remove();
        const noteButtons = closestNote.find('button');
				noteButtons.replaceWith((i, innerHTML)=>{
          const command = noteButtons[i].getAttribute('data-slash-command');
					if(command){
						innerHTML = `[roll]${command}[/roll]`
					}
          return innerHTML;
        })
        closestNote.find('.abovevtt-slash-command-journal').replaceWith((i, innerHTML) =>{
					return innerHTML;
				})
        const sanitizedHTML = basic_sanitize_html(closestNote[0].innerHTML).replaceAll(/\[(\/)?spell\]/gi, `[$1spell]`).replaceAll(/\[(\/)?magicitem\]/gi, `[$1magicItem]`).replaceAll(/\[(\/)?item\]/gi, `[$1item]`);
        
        window.JOURNAL.notes[customStatId].text = sanitizedHTML; 
        window.JOURNAL.notes[customStatId].plain = $(window.JOURNAL.notes[customStatId].text).text();
        debounceSendNote(customStatId, window.JOURNAL.notes[customStatId], tokenId);
        window.JOURNAL.setPersistTimeout();
			})
    }
    if($html.find('.dnd-sheet').length>0){
      container.css('min-width', '575px');
    }else{
      container.css('min-width', '200px');
    }
    add_aoe_statblock_click(container, tokenId);

    container.find("img.monster-image, .monster-image").each((i,block) => {
      createSendPlayerButton(block, "login", true).insertAfter(block);
    });
    //Note: this is async - that is why code just above here isn't lower down
    if(!customStatBlock){
      statBlock.imageHtml(token).then(theImage => {
        //add in send-to features
        container.find("div.image").append(theImage).find("img.monster-image, video").each((i,block) => {
          createSendPlayerButton(block, "login", true).insertAfter(block);
        });
      })
    }
      
    container.find("a").attr("target", "_blank"); // make sure we only open links in new tabs
    if(!customStatBlock && !statBlock.data?.open5e)
      scan_monster(container, statBlock, tokenId);
    else
      add_ability_tracker_inputs(container, tokenId)

    add_stat_block_hover(container, tokenId);
    //todo: new sendtogamelog menu for these too?
    container.find("p>em>strong, p>strong>em, div>strong>em, div>em>strong, p>span>em>strong, p>span>strong>em").off("contextmenu.sendToGamelog").on("contextmenu.sendToGamelog", function (e) {
      e.preventDefault();
      if(e.altKey || e.shiftKey || (!isMac() && e.ctrlKey) || e.metaKey)
        return;
      let outerP = e.target.closest('p, div').outerHTML;
      const regExFeature = new RegExp(`${e.target.outerHTML.replace(/([\(\)])/g,"\\$1")}[\\s\\S]+?(?=(<\/p>|<\/div>|<strong><em|<em><strong))`, 'gi');
      let match = outerP.match(regExFeature);


      if(match){
        let matched = `<p>${match[0]}</p>`;
        

        if($(e.target.closest('p, div')).find('em>strong, strong>em').length == 1){
          let nextParagraphs = $(e.target.closest('p, div')).nextUntil('p:has(>em>strong), p:has(>strong>em), div:has(>strong>em), div:has(>em>strong)');
          for(let i=0; i<nextParagraphs.length; i++){   
            matched = `${matched}${nextParagraphs[i].outerHTML.trim()}`;
          }
        }
        
         
         matched = `<div>${matched}</div>`;
        send_html_to_gamelog(matched);
      }
      
    })

    container.find("p>em>strong, p>strong>em, div>strong>em, div>em>strong, p>span>em>strong, p>span>strong>em").off("click.roll").on("click.roll", function (e) {
      e.preventDefault();
      if($(e.target).text().includes('Recharge'))
        return;
      let rollButtons = $(e.currentTarget).closest('em:has(strong), strong:has(em)').nextUntil(':has(.avtt-ability-roll-button)')
      rollButtons = rollButtons.add(rollButtons.find('.avtt-roll-button:not([data-rolltype="recharge"]), .avtt-roll-formula-button')).closest('.avtt-roll-button:not([data-rolltype="recharge"]), .avtt-roll-formula-button');
      


      const displayName = window.TOKEN_OBJECTS[tokenId] ? window.TOKEN_OBJECTS[tokenId].options?.revealname == true ? window.TOKEN_OBJECTS[tokenId].options.name : `` : target.find(".mon-stat-block__name-link").text(); // Wolf, Owl, etc
      const creatureAvatar = window.TOKEN_OBJECTS[tokenId]?.options.imgsrc || statBlock?.data?.avatarUrl;
      $(e.target.closest('p, div')).find('.avtt-aoe-button')?.click();
      for(let i = 0; i<rollButtons.length; i++){      
        let data = getRollData(rollButtons[i]);
        let diceRoll;

        if(data.expression != undefined){
          if (/^1d20[+-]([0-9]+)/g.test(data.expression)) {
             if(e.altKey){
                if(e.shiftKey){
                  diceRoll = new DiceRoll(`3d20kh1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
                 }
                 else if((!isMac() && e.ctrlKey) || e.metaKey){
                  diceRoll = new DiceRoll(`3d20kl1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
                 }
             }
             else if(e.shiftKey){
              diceRoll = new DiceRoll(`2d20kh1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
             }
             else if((!isMac() && e.ctrlKey) || e.metaKey){
              diceRoll = new DiceRoll(`2d20kl1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
             }else{
              diceRoll = new DiceRoll(data.expression, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster")
             }
          }
          else{
            diceRoll = new DiceRoll(data.expression, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster")
          }
        

 
          window.diceRoller.roll(diceRoll, true, undefined, get_avtt_setting_value('monsterCritType'), undefined, data.damageType);

        }
      }
    })
    let abilities= container.find("p>em>strong, p>strong>em, div>strong>em, div>em>strong, p>span>em>strong, p>span>strong>em");

    for(let i = 0; i<abilities.length; i++){
      if($(abilities[i]).closest('em:has(strong), strong:has(em)').nextUntil('em:has(strong), strong:has(em)').is('.avtt-roll-button, :has(.avtt-roll-button)')){
        $(abilities[i]).toggleClass('avtt-ability-roll-button', true);
      }
    }
    $("span.hideme").parent().parent().hide();
    container.find('.lockStatButton, .download_button, .upload_button, .add-table-row, .table-row-drag-handle, .header-spacer').remove();
    if(customStatBlock && container.find('.dnd-sheet').length>0){
      container.find('a').attr('contenteditable', 'false');
      container.find('.popout-button').remove();
      const lockStatButton = $(`<div class='lockStatButton' style="cursor: pointer; position: absolute;
                                              left: 2px;
                                              top: 3px;
                                              width: 20px;
                                              height: 20px;
                                              color: #ddd;">
                                  <span title="lock buttons" class="material-symbols-outlined" style="font-size:20px;">
                                    ${!window.lockTemplateStatBlocks ? "lock_open_right" : "lock"}
                                  </span>
                                </div>`)
      lockStatButton.off('click.lockStatBlock').on('click.lockStatBlock', ()=>{
        window.lockTemplateStatBlocks = !window.lockTemplateStatBlocks;
        const span = lockStatButton.find('>span');
        if(window.lockTemplateStatBlocks){
          container.find('.dnd-sheet button').attr("contenteditable", "false");
          span.text('lock');
        } else{
          container.find('.dnd-sheet [contenteditable]:not(a)').attr("contenteditable", "true");
          span.text('lock_open_right');
        }
      })
      
      if(window.lockTemplateStatBlocks){
         container.find('.dnd-sheet button').attr("contenteditable", "false");
      } else{
        container.find('.dnd-sheet [contenteditable]:not(a)').attr("contenteditable", "true");
      }

      const downloadStat = $(`<div class='download_button' style="cursor: pointer; position: absolute;
                                              left: 25px;
                                              top: 3px;
                                              width: 20px;
                                              height: 20px;
                                              color: #ddd;">
                                  <span title="Download Statblock as HTML" class="material-symbols-outlined" style="font-size:20px;">
                                    download
                                  </span>
                                </div>`)
      downloadStat.off('click.exportStatBlock').on('click.exportStatBlock', function () { 
          build_import_loading_indicator('Preparing Export File');

          const currentdate = new Date(); 
          const datetime = `${currentdate.getFullYear()}-${(currentdate.getMonth()+1)}-${currentdate.getDate()}`
          const santizedHtml = basic_sanitize_html(window.JOURNAL.notes[window.TOKEN_OBJECTS[tokenId].options.statBlock].text);      
          let html = $(`${santizedHtml}`);
          html.find('.injected-input, .added-input-desc').remove();
          html.find('.add-input:not(.avtt-custom-tracker)').replaceWith((i, innerHtml) => {
            return innerHtml;
          })
          window.JOURNAL.translateHtmlAndBlocks(html).then(()=>{
            window.JOURNAL.add_journal_tooltip_targets(html);
					  html.find('.add-input').each(function(){window.JOURNAL.addTrackedInputs($(this), {token: window.TOKEN_OBJECTS[tokenId]})})
            html.find('a').attr('contenteditable', 'false');
            html.find('.abovevtt-slash-command-journal').replaceWith((i, innerHTML) =>{
              return `[roll]${innerHTML}[/roll]`;
            })
            html = `<style id='contentStyles'>
              ${window.JOURNAL.content_styles()}			
              .custom-stat{
                color: --var(--pc-template-text-color, #111) !important;
                border: none !important;
              }
              .ignore-abovevtt-formating{
                border: none !important;
              }    
            </style>
            <script>
              window.addEventListener("click", (e) => {
                if (e.target && e.target.nodeName === 'INPUT' && e.target.type === 'checkbox') {				
                  if (e.target.checked) {
                    e.target.setAttribute('checked', 'checked');
                  } else {
                    e.target.removeAttribute('checked');
                  }
                }
                window.addEventListener('input', (e) => {
                  if (e.target && e.target.nodeName === 'INPUT' && e.target.type === 'number') {
                    e.target.setAttribute('value', e.target.value);
                  }
                });
              });
            </script>
            ${html[0].outerHTML}
            <script>
              document.querySelectorAll('table').forEach((table) => {
                if (table.nextElementSibling?.classList.contains('add-table-row')) return;

                const addTableRowButton = document.createElement('button');
                addTableRowButton.className = 'add-table-row';
                addTableRowButton.type = 'button';
                addTableRowButton.textContent = '+';
                table.insertAdjacentElement('afterend', addTableRowButton);
                setupTableRowDragging(table);
              });

              document.addEventListener('click', (e) => {
                const addButton = e.target.closest('.add-table-row');
                if (!addButton) return;

                e.preventDefault();

                const table = addButton.previousElementSibling;
                if (!table || table.tagName.toLowerCase() !== 'table') return;

                addRowToTable(table);
              })'
					  </script>`;
            download(html,`${window.CAMPAIGN_INFO.name}-${datetime}-pctemplate.html`,"text/html");
              
            $(".import-loading-indicator").remove();        
          })      
      });
      const uploadStat = $(`<div class='upload_button' style="cursor: pointer; position: absolute;
                                              left: 45px;
                                              top: 3px;
                                              width: 20px;
                                              height: 20px;
                                              color: #ddd;">
                    <span onclick='import_open_template();' title="Upload HTML Statblock" class="material-symbols-outlined" style="font-size:20px;">
                      upload
                    </span>
                    <input accept='.html' id='input_pc_template' type='file' single style='display: none' />
                  </div>
                  `);
      uploadStat.find('input[type="file"]').change(function(e) {
        import_pc_template_html(e.target.files, $html, window.TOKEN_OBJECTS[tokenId]?.options?.statBlock, tokenId);
      });
      container.prepend(lockStatButton, downloadStat, uploadStat);
			container.find('table').each(function() {
        const $table = $(this);
        const rowsContainer = $table.find('tbody').length > 0 ? $table.find('tbody') : $table;
        if (rowsContainer.find('> tr').length > 1) {
          rowsContainer.find('> tr').each(function() {
            const $row = $(this);
            if ($row.find('> .table-row-drag-handle').length === 0) {
              const $handleCell = $('<td class="table-row-drag-handle" aria-hidden="true">⋮⋮</td>');
              $row.prepend($handleCell);
            }
          });

          rowsContainer.sortable({
            items: '> tr',
            handle: '.table-row-drag-handle',
            helper: function(event, ui) {
              const helper = ui.clone();
              helper.children().each(function(index) {
                $(this).width(ui.children().eq(index).outerWidth());
              });
              return helper;
            },
            placeholder: 'ui-sortable-placeholder',
            update: function() {
              const closestNote = container.find('.avtt-stat-block-container').first();
              const noteText = closestNote.length > 0 ? closestNote : container;
              const noteClone = noteText.clone(true, true);
              const avttImages = noteClone.find('img[data-src*="above-bucket-not-a-url"]');
              avttImages.attr('src', '');
              avttImages.attr('href', '');
              noteClone.find('a:empty, button:empty, .image, .add-table-row').remove();
              const noteButtons = noteClone.find('button');
              noteButtons.replaceWith((i, innerHTML)=>{
                const command = noteButtons[i].getAttribute('data-slash-command');
                if(command){
                  innerHTML = `[roll]${command}[/roll]`
                }
                return innerHTML;
              })
              noteClone.find('.abovevtt-slash-command-journal').replaceWith((i, innerHTML) =>{
                return innerHTML;
              })
              const sanitizedHTML = basic_sanitize_html(noteClone[0].innerHTML).replaceAll(/\[(\/)?spell\]/gi, `[$1spell]`).replaceAll(/\[(\/)?magicitem\]/gi, `[$1magicItem]`).replaceAll(/\[(\/)?item\]/gi, `[$1item]`);
              window.JOURNAL.notes[window.TOKEN_OBJECTS[tokenId]?.options?.statBlock].text = sanitizedHTML;
              window.JOURNAL.notes[window.TOKEN_OBJECTS[tokenId]?.options?.statBlock].plain = $(sanitizedHTML).text();
              window.JOURNAL.setPersistTimeout();
              debounceSendNote(window.TOKEN_OBJECTS[tokenId]?.options?.statBlock, window.JOURNAL.notes[window.TOKEN_OBJECTS[tokenId]?.options?.statBlock], tokenId);
            }
          })
          const header = $table.find('th').first().parent().parent();
          header.find('> tr').each(function() {
            const $row = $(this);
            if ($row.find('> .header-spacer').length === 0) {
              const $handleCell = $('<th class="header-spacer" aria-hidden="true"></td>');
              $row.prepend($handleCell);
            }
          });
        }
        if($table.next('.add-table-row').length>0)
          return;
        const add_table_row = $(`<button class="add-table-row">+</button>`); 	
				$table.after(add_table_row);


			});
      container.off('click.addRow').on('click.addRow', '.add-table-row', function (e) {
				e.preventDefault();
			  const table = $(e.target).prev('table');
				const tableBody = $(table).find('tbody');
				const targetContainer = tableBody.length>0 ? tableBody : table;
				const newRow = targetContainer.find('>tr:last').clone();
				newRow.find('td:not(.table-row-drag-handle), th').html('');
				targetContainer.append(newRow);
			});
		}
	}

function import_open_template(){
  $("#input_pc_template").trigger("click");
}
function import_pc_template_html(files, parentEle, customStatId, tokenId) {
	if (!files.length) return;
	build_import_loading_indicator('Preparing Import');

	let processed = 0;
	let file = files[0]
  const reader = new FileReader();
  reader.onload = function () {
    try {
      const sanitizedHTML = basic_sanitize_html(reader.result);
      parentEle.html(sanitizedHTML);
      const token = window.TOKEN_OBJECTS[tokenId];
      parentEle.find('.injected-input').each((i, ele)=>{
        const value = ele.value;
        const target = ele.getAttribute("data-tracker-key");
        const targetTokenId = ele.getAttribute("data-token-id");
        if(token && targetTokenId != undefined && targetTokenId != ''){
          token.track_ability(target, value);
        } else{
          window.JOURNAL.track_ability(target, value, customStatId);
        }
      })
      debounceRescanStatBlock(parentEle, customStatId, tokenId);
      window.JOURNAL.notes[customStatId].text = sanitizedHTML.replaceAll(/\[(\/)?spell\]/gi, `[$1spell]`).replaceAll(/\[(\/)?magicitem\]/gi, `[$1magicItem]`).replaceAll(/\[(\/)?item\]/gi, `[$1item]`); 
      window.JOURNAL.notes[customStatId].plain = $(window.JOURNAL.notes[customStatId].text).text();
      debounceSendNote(customStatId, window.JOURNAL.notes[customStatId], tokenId);
      window.JOURNAL.setPersistTimeout();
      $('.import-loading-indicator').remove();
    } catch (e) {
      console.error('Failed to import file', file.name, e);
      $('.import-loading-indicator').remove();
    }
    
  };
	reader.readAsText(file);
}
const debounceRescanStatBlock = mydebounce(async (container, noteId, tokenId) => {
  const token = window.TOKEN_OBJECTS[tokenId];
  
  let targetRescan = $(container).find('.avtt-stat-block-container, .note-text').first();
  if(!targetRescan.length){
    container = $(container).closest('.avtt-stat-block-container, .note-text').parent();
    targetRescan = $(container).find('.avtt-stat-block-container, .note-text').first();
  }
  $(targetRescan).html(window.JOURNAL.notes[noteId].text);
  $(container).find('.injected-input, .added-input-desc').remove();
  $(container).find('.add-input:not(.avtt-custom-tracker)').replaceWith((i, innerHtml) => {
    return innerHtml;
  })
  const currScroll = targetRescan[0].scrollTop;
  await window.JOURNAL.translateHtmlAndBlocks(targetRescan);
  add_journal_roll_buttons(targetRescan, tokenId);
  window.JOURNAL.add_journal_tooltip_targets(targetRescan);
  add_ability_tracker_inputs(targetRescan, tokenId);
  $(container).find('.add-input').each(function(){window.JOURNAL.addTrackedInputs($(this), {token, noteId})});
  add_stat_block_hover(targetRescan, tokenId);
  add_aoe_statblock_click(targetRescan, tokenId);
  targetRescan.find('a').attr('contenteditable', 'false');
  if(tokenId){
    container.find("img.monster-image, .monster-image").each((i,block) => {
      createSendPlayerButton(block, "login", true).insertAfter(block);
    });

    //todo: new sendtogamelog menu for these too?
    container.find("p>em>strong, p>strong>em, div>strong>em, div>em>strong, p>span>em>strong, p>span>strong>em").off("contextmenu.sendToGamelog").on("contextmenu.sendToGamelog", function (e) {
      e.preventDefault();
      if(e.altKey || e.shiftKey || (!isMac() && e.ctrlKey) || e.metaKey)
        return;
      let outerP = e.target.closest('p, div').outerHTML;
      const regExFeature = new RegExp(`${e.target.outerHTML.replace(/([\(\)])/g,"\\$1")}[\\s\\S]+?(?=(<\/p>|<\/div>|<strong><em|<em><strong))`, 'gi');
      let match = outerP.match(regExFeature);


      if(match){
        let matched = `<p>${match[0]}</p>`;
        

        if($(e.target.closest('p, div')).find('em>strong, strong>em').length == 1){
          let nextParagraphs = $(e.target.closest('p, div')).nextUntil('p:has(>em>strong), p:has(>strong>em), div:has(>strong>em), div:has(>em>strong)');
          for(let i=0; i<nextParagraphs.length; i++){   
            matched = `${matched}${nextParagraphs[i].outerHTML.trim()}`;
          }
        }
        
          
          matched = `<div>${matched}</div>`;
        send_html_to_gamelog(matched);
      }
      
    })

    container.find("p>em>strong, p>strong>em, div>strong>em, div>em>strong, p>span>em>strong, p>span>strong>em").off("click.roll").on("click.roll", function (e) {
      e.preventDefault();
      if($(e.target).text().includes('Recharge'))
        return;
      let rollButtons = $(e.currentTarget).closest('em:has(strong), strong:has(em)').nextUntil(':has(.avtt-ability-roll-button)')
      rollButtons = rollButtons.add(rollButtons.find('.avtt-roll-button:not([data-rolltype="recharge"]), .avtt-roll-formula-button')).closest('.avtt-roll-button:not([data-rolltype="recharge"]), .avtt-roll-formula-button');
      


      const displayName = window.TOKEN_OBJECTS[tokenId] ? window.TOKEN_OBJECTS[tokenId].options?.revealname == true ? window.TOKEN_OBJECTS[tokenId].options.name : `` : target.find(".mon-stat-block__name-link").text(); // Wolf, Owl, etc
      const creatureAvatar = window.TOKEN_OBJECTS[tokenId]?.options.imgsrc || statBlock?.data?.avatarUrl;
      $(e.target.closest('p, div')).find('.avtt-aoe-button')?.click();
      for(let i = 0; i<rollButtons.length; i++){      
        let data = getRollData(rollButtons[i]);
        let diceRoll;

        if(data.expression != undefined){
          if (/^1d20[+-]([0-9]+)/g.test(data.expression)) {
              if(e.altKey){
                if(e.shiftKey){
                  diceRoll = new DiceRoll(`3d20kh1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
                  }
                  else if((!isMac() && e.ctrlKey) || e.metaKey){
                  diceRoll = new DiceRoll(`3d20kl1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
                  }
              }
              else if(e.shiftKey){
              diceRoll = new DiceRoll(`2d20kh1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
              }
              else if((!isMac() && e.ctrlKey) || e.metaKey){
              diceRoll = new DiceRoll(`2d20kl1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
              }else{
              diceRoll = new DiceRoll(data.expression, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster")
              }
          }
          else{
            diceRoll = new DiceRoll(data.expression, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster")
          }
        


          window.diceRoller.roll(diceRoll, true, undefined, get_avtt_setting_value('monsterCritType'), undefined, data.damageType);

        }
      }
    })
    let abilities= container.find("p>em>strong, p>strong>em, div>strong>em, div>em>strong, p>span>em>strong, p>span>strong>em");

    for(let i = 0; i<abilities.length; i++){
      if($(abilities[i]).closest('em:has(strong), strong:has(em)').nextUntil('em:has(strong), strong:has(em)').is('.avtt-roll-button, :has(.avtt-roll-button)')){
        $(abilities[i]).toggleClass('avtt-ability-roll-button', true);
      }
    }
    $("span.hideme").parent().parent().hide();
  }
  container.find('table').each(function() {
    const $table = $(this);
    const rowsContainer = $table.find('tbody').length > 0 ? $table.find('tbody') : $table;
    if (rowsContainer.find('> tr').length > 1) {
      rowsContainer.find('> tr').each(function() {
        const $row = $(this);
        if ($row.find('> .table-row-drag-handle').length === 0) {
          const $handleCell = $('<td class="table-row-drag-handle" aria-hidden="true">⋮⋮</td>');
          $row.prepend($handleCell);
        }
      });

      rowsContainer.sortable({
        items: '> tr',
        handle: '.table-row-drag-handle',
        helper: function(event, ui) {
          const helper = ui.clone();
          helper.children().each(function(index) {
            $(this).width(ui.children().eq(index).outerWidth());
          });
          return helper;
        },
        placeholder: 'ui-sortable-placeholder',
        update: function() {
          const closestNote = container.find('.avtt-stat-block-container').first();
          const noteText = closestNote.length > 0 ? closestNote : container;
          const noteClone = noteText.clone(true, true);
          const avttImages = noteClone.find('img[data-src*="above-bucket-not-a-url"]');
          avttImages.attr('src', '');
          avttImages.attr('href', '');
          noteClone.find('a:empty, button:empty, .image, .add-table-row').remove();
          const noteButtons = noteClone.find('button');
          noteButtons.replaceWith((i, innerHTML)=>{
            const command = noteButtons[i].getAttribute('data-slash-command');
            if(command){
              innerHTML = `[roll]${command}[/roll]`
            }
            return innerHTML;
          })
          noteClone.find('.abovevtt-slash-command-journal').replaceWith((i, innerHTML) =>{
            return innerHTML;
          })
          const sanitizedHTML = basic_sanitize_html(noteClone[0].innerHTML).replaceAll(/\[(\/)?spell\]/gi, `[$1spell]`).replaceAll(/\[(\/)?magicitem\]/gi, `[$1magicItem]`).replaceAll(/\[(\/)?item\]/gi, `[$1item]`);
          window.JOURNAL.notes[window.TOKEN_OBJECTS[tokenId]?.options?.statBlock].text = sanitizedHTML;
          window.JOURNAL.notes[window.TOKEN_OBJECTS[tokenId]?.options?.statBlock].plain = $(sanitizedHTML).text();
          window.JOURNAL.setPersistTimeout();
          debounceSendNote(window.TOKEN_OBJECTS[tokenId]?.options?.statBlock, window.JOURNAL.notes[window.TOKEN_OBJECTS[tokenId]?.options?.statBlock], tokenId);
        }
      })
      const header = $table.find('th').first().parent().parent();
      header.find('> tr').each(function() {
        const $row = $(this);
        if ($row.find('> .header-spacer').length === 0) {
          const $handleCell = $('<th class="header-spacer" aria-hidden="true"></td>');
          $row.prepend($handleCell);
        }
      });
    }
    if($table.next('.add-table-row').length>0)
      return;
    const add_table_row = $(`<button class="add-table-row">+</button>`);	
    $table.after(add_table_row);
  });
  targetRescan.off('click.addRow').on('click.addRow', '.add-table-row', function (e) {
    e.preventDefault();
			const table = $(e.target).prev('table');
      const tableBody = $(table).find('tbody');
      const targetContainer = tableBody.length>0 ? tableBody : table;
      const newRow = targetContainer.find('>tr:last').clone();
      newRow.find('td:not(.table-row-drag-handle), th').html('');
      targetContainer.append(newRow);
  });

  $(container).find('.avtt-stat-block-container, .note-text')[0].scrollTop = currScroll;


  if(window.lockTemplateStatBlocks){
    container.find('.dnd-sheet button').attr("contenteditable", "false");
  } else{
    container.find('.dnd-sheet [contenteditable]:not(a)').attr("contenteditable", "true");
  }
}, 1000);


async function build_monster_stat_block(statBlock, token) {
  if (!statBlock.userHasAccess) {
      return `<div id='noAccessToContent' style='height: 100%;text-align: center;width: 100%;padding: 10px;font-weight: bold;color: #944;'>You do not have access to this content on DndBeyond.</div>`;
  }
  let statblockData = '';
  const image = token?.options?.imgsrc?.startsWith('above-bucket-not-a-url')
    ? await getAvttStorageUrl(token.options.imgsrc)
    : token?.options?.imgsrc == statBlock.data.avatarUrl || token?.options?.imgsrc == undefined
      ? statBlock.data.largeAvatarUrl
      : token.options.imgsrc
  if (get_avtt_setting_value('statBlockStyle') == 0 && (statBlock.data.initiativeBonus != null || statBlock.data['5.5e'] == true) || get_avtt_setting_value('statBlockStyle') == 2) {
    statblockData = `
    <div class="container avtt-stat-block-container ${(statBlock.data.slug) ? 'open5eMonster' : ''}">
      <div id="content" class="main content-container" style="padding:0!important">
        <section class="primary-content" role="main">

          <div class="monster-details">

            <div class="more-info details-more-info" style="padding: 2px;">
              <div class="detail-content">  
                <div class='nohide'>          

                  <div class="stat-block">
                      <div class="mon-stat-block-2024__header">
                          <div class="mon-stat-block-2024__name">
                              <a class="mon-stat-block-2024__name-link" href="${statBlock.data.url}" target="_blank">
                                ${statBlock.data.name}
                              </a>
                          </div>

                            <div class="mon-stat-block__meta ddbc-creature-block__meta">${statBlock.sizeName} ${statBlock.monsterTypeHtml}, ${statBlock.alignmentName}</div>
                      </div>
                      <div class="mon-stat-block__attributes">
                        <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                          <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Armor Class</span>
                          <span class="mon-stat-block__attribute-value">
                            <span class="mon-stat-block__attribute-data-value">
                                ${statBlock.data.armorClass}
                            </span>
                            <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                                ${statBlock.data.armorClassDescription}
                            </span>
                          </span>
                          <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Initiative</span>
                          <span class="mon-stat-block__attribute-value">
                            <span class="mon-stat-block__attribute-data-value">
                                ${statBlock.initiativeButton()}</span>
                            ${statBlock.data.initiativeBonus != null ? `<span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                                (${statBlock.data.initiativeBonus + 10})
                            </span>` : ``}   
                          </span>       
                        </div>
                        <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                          <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Hit Points</span>
                          <span class="mon-stat-block__attribute-data">
                            <span class="mon-stat-block__attribute-data-value">
                                ${statBlock.data.averageHitPoints}
                            </span>
                            <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                                (${statBlock.data.hitPointDice.diceString})
                            </span>
                          </span>
                        </div>
                        <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                          <span class="mon-stat-block__attribute-label">Speed</span>
                          <span class="mon-stat-block__attribute-data">
                            <span class="mon-stat-block__attribute-data-value">
                                ${statBlock.speedDescription}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div class="stats">
                          <table class="abilities-saves physical">
                              <thead>
                                  <tr>
                                      <th>
                                      </th><th>
                                      </th><th>Mod</th>
                                      <th>Save</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  <tr>                             
                                      <th>STR</th>
                                      <td>${statBlock.str}</td>
                                      <td class="modifier">${statBlock.statButton(statBlock.str, "STR", false)}</td>
                                      <td class="modifier">${statBlock.saveButton(statBlock.strSave, "STR")}</td>
                                  </tr>
                                  <tr>
                                      <th>DEX</th>
                                      <td>${statBlock.dex}</td>
                                      <td class="modifier">${statBlock.statButton(statBlock.dex, "DEX", false)}</td>
                                      <td class="modifier">${statBlock.saveButton(statBlock.dexSave, "DEX")}</td>
                                  </tr>
                                  <tr>
                                      <th>CON</th>
                                      <td>${statBlock.con}</td>
                                      <td class="modifier">${statBlock.statButton(statBlock.con, "CON", false)}</td>
                                      <td class="modifier">${statBlock.saveButton(statBlock.conSave, "CON")}</td>
                                  </tr>
                              </tbody>
                          </table>
                          <table class="abilities-saves mental">
                              <thead>
                                  <tr>
                                      <th>
                                      </th><th>
                                      </th><th>Mod</th>
                                      <th>Save</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  <tr>
                                      <th>INT</th>
                                      <td>${statBlock.int}</td>
                                      <td class="modifier">${statBlock.statButton(statBlock.int, "INT", false)}</td>
                                      <td class="modifier">${statBlock.saveButton(statBlock.intSave, "INT")}</td>
                                  </tr>
                                  <tr>
                                      <th>WIS</th>
                                      <td>${statBlock.wis}</td>
                                      <td class="modifier">${statBlock.statButton(statBlock.wis, "WIS", false)}</td>
                                      <td class="modifier">${statBlock.saveButton(statBlock.wisSave, "WIS")}</td>
                                  </tr>
                                  <tr>
                                      <th>CHA</th>
                                      <td>${statBlock.cha}</td>
                                      <td class="modifier">${statBlock.statButton(statBlock.cha, "CHA", false)}</td>
                                      <td class="modifier">${statBlock.saveButton(statBlock.chaSave, "CHA")}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                      <div class="mon-stat-block__tidbits">



                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Skills</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.skillsHtml}
                          </span>
                        </div>
                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Gear</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.gearHtml}
                          </span>
                        </div>
                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Vulnerabilities</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.damageVulnerabilitiesHtml}
                          </span>
                        </div>
                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Resistances</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.damageResistancesHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Immunities</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.damageImmunitiesHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Condition Immunities</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.conditionImmunitiesHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Senses</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.sensesHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Languages</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.languagesHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit-container">
                          <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                            <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Challenge</span>
                            <span class="mon-stat-block__tidbit-data">
                              ${statBlock.challengeRatingHtml}
                            </span>
                          </div>

                          <div class="mon-stat-block__tidbit-spacer"></div>
                          <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                            <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Proficiency Bonus</span>
                            <span class="mon-stat-block__tidbit-data">
                                ${statBlock.proficiencyBonusHtml}
                            </span>
                          </div>

                        </div>

                      </div>

                      
                      
                      <div class="mon-stat-block__description-blocks ddbc-creature-block__description-blocks">

                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                          <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Traits</div>
                          <div class="mon-stat-block__description-block-content">
                            ${statBlock.specialTraitsDescription}
                          </div>
                        </div>

                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                          <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Actions</div>
                          <div class="mon-stat-block__description-block-content">
                            ${statBlock.actionsDescription}
                          </div>
                        </div>
                        
                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                            <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Bonus Actions</div>
                            <div class="mon-stat-block__description-block-content">
                              ${statBlock.bonusActionsDescription}
                            </div>
                        </div>

                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                            <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Reactions</div>
                            <div class="mon-stat-block__description-block-content">
                              ${statBlock.reactionsDescription}
                            </div>
                        </div>

                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                            <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Legendary Actions</div>
                            <div class="mon-stat-block__description-block-content">
                              ${statBlock.legendaryActionsDescription}
                            </div>
                        </div>

                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                            <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Mythic Actions</div>
                            <div class="mon-stat-block__description-block-content">
                              ${statBlock.mythicActionsDescription}
                            </div>
                        </div>
                      </div>
                  </div>    


                            
                            
                  <div class="image" style="display: block;"></div>

                  <div class="more-info-content" style="padding:10px;">

                  <div class="mon-details__description-block">
                    <h3 class="mon-details__description-block-heading">Description</h3>
                    <div class="mon-details__description-block-content">
                        ${statBlock.characteristicsDescription}
                    </div>
                  </div>
                  
                  <div class="mon-details__description-block">
                    <div class="mon-details__description-block-content">
                        ${statBlock.lairDescription}
                    </div>
                  </div>
        
        

                  

                  <footer>
                      
                      ${statBlock.data.treasure ? `<p>${statBlock.data.treasure}</p>` : ''}
                      
                      ${statBlock.sourceBookHtml}
                  </footer>
                </div>          
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `

  }
  else {  
    statblockData = `
    <div class="container avtt-stat-block-container ${(statBlock.data.slug) ? 'open5eMonster' : ''}">
      <div id="content" class="main content-container" style="padding:0!important">
        <section class="primary-content" role="main">

          <div class="monster-details">

            <div class="more-info details-more-info" style="padding: 2px;">
              <div class="detail-content">

                <div class="mon-stat-block ddbc-creature-block" style="column-count: 1;margin:0;">
                  <div class="mon-stat-block__header ddbc-creature-block__header">
                    <div class="mon-stat-block__name ddbc-creature-block__name">
                      <a class="mon-stat-block__name-link ddbc-creature-block__name-link" href="${statBlock.data.url}" target="_blank">
                        ${statBlock.data.name}
                      </a>
                    </div>

                    <div class="mon-stat-block__meta ddbc-creature-block__meta">${statBlock.sizeName} ${statBlock.monsterTypeHtml}, ${statBlock.alignmentName}</div>
                  </div>
                  <div class="mon-stat-block__separator ddbc-creature-block__separator">
                    <img class="mon-stat-block__separator-img ddbc-creature-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                  </div>
                  <div class="mon-stat-block__attributes">
                    <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                      <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Armor Class</span>
                      <span class="mon-stat-block__attribute-value">
                        <span class="mon-stat-block__attribute-data-value">
                            ${statBlock.data.armorClass}
                        </span>
                        <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                            ${statBlock.data.armorClassDescription}
                        </span>
                      </span>
                      <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Initiative</span>
                      <span class="mon-stat-block__attribute-value">
                        <span class="mon-stat-block__attribute-data-value">
                            ${statBlock.initiativeButton()}
                        </span>
                        ${statBlock.data.initiativeBonus != null ? `<span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                            (${statBlock.data.initiativeBonus + 10})
                        </span>` : ``}   
                      </span>        
                    </div>
                    <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                      <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Hit Points</span>
                      <span class="mon-stat-block__attribute-data">
                        <span class="mon-stat-block__attribute-data-value">
                            ${statBlock.data.averageHitPoints}
                        </span>
                        <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                            (${statBlock.data.hitPointDice.diceString})
                        </span>
                      </span>
                    </div>
                    <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                      <span class="mon-stat-block__attribute-label">Speed</span>
                      <span class="mon-stat-block__attribute-data">
                        <span class="mon-stat-block__attribute-data-value">
                            ${statBlock.speedDescription}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div class="mon-stat-block__stat-block">
                    <div class="mon-stat-block__separator">
                      <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                    </div>
                    <div class="ability-block ddbc-creature-block__abilities">
                      <div class="ability-block__stat ability-block__stat--str ddbc-creature-block__ability-stat">
                        <div class="ability-block__heading ddbc-creature-block__ability-heading">STR</div>
                        <div class="ability-block__data">
                          <span class="ability-block__score">${statBlock.str}</span>
                          <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.str, "STR")}</span>
                        </div>
                      </div>
                      <div class="ability-block__stat ability-block__stat--dex ddbc-creature-block__ability-stat">
                        <div class="ability-block__heading ddbc-creature-block__ability-heading">DEX</div>
                        <div class="ability-block__data">
                          <span class="ability-block__score">${statBlock.dex}</span>
                          <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.dex, "DEX")}</span>
                        </div>
                      </div>
                      <div class="ability-block__stat ability-block__stat--con ddbc-creature-block__ability-stat">
                        <div class="ability-block__heading ddbc-creature-block__ability-heading">CON</div>
                        <div class="ability-block__data">
                          <span class="ability-block__score">${statBlock.con}</span>
                          <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.con, "CON")}</span>
                        </div>
                      </div>
                      <div class="ability-block__stat ability-block__stat--int ddbc-creature-block__ability-stat">
                        <div class="ability-block__heading ddbc-creature-block__ability-heading">INT</div>
                        <div class="ability-block__data">
                          <span class="ability-block__score">${statBlock.int}</span>
                          <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.int, "INT")}</span>
                        </div>
                      </div>
                      <div class="ability-block__stat ability-block__stat--wis ddbc-creature-block__ability-stat">
                        <div class="ability-block__heading ddbc-creature-block__ability-heading">WIS</div>
                        <div class="ability-block__data">
                          <span class="ability-block__score">${statBlock.wis}</span>
                          <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.wis, "WIS")}</span>
                        </div>
                      </div>
                      <div class="ability-block__stat ability-block__stat--cha ddbc-creature-block__ability-stat">
                        <div class="ability-block__heading ddbc-creature-block__ability-heading">CHA</div>
                        <div class="ability-block__data">
                          <span class="ability-block__score">${statBlock.cha}</span>
                          <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.cha, "CHA")}</span>
                        </div>
                      </div>
                    </div>
                    <div class="mon-stat-block__separator">
                      <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                    </div>
                  </div>
                  <div class="mon-stat-block__tidbits">

                    <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                      <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Saving Throws</span>
                      <span class="mon-stat-block__tidbit-data">
                        ${statBlock.savingThrowsHtml}
                      </span>
                    </div>

                    <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                      <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Skills</span>
                      <span class="mon-stat-block__tidbit-data">
                        ${statBlock.skillsHtml}
                      </span>
                    </div>
                    <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                      <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Gear</span>
                      <span class="mon-stat-block__tidbit-data">
                        ${statBlock.gearHtml}
                      </span>
                    </div>
                    <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                      <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Vulnerabilities</span>
                      <span class="mon-stat-block__tidbit-data">
                        ${statBlock.damageVulnerabilitiesHtml}
                      </span>
                    </div>
                    <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                      <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Resistances</span>
                      <span class="mon-stat-block__tidbit-data">
                        ${statBlock.damageResistancesHtml}
                      </span>
                    </div>

                    <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                      <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Immunities</span>
                      <span class="mon-stat-block__tidbit-data">
                        ${statBlock.damageImmunitiesHtml}
                      </span>
                    </div>

                    <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                      <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Condition Immunities</span>
                      <span class="mon-stat-block__tidbit-data">
                        ${statBlock.conditionImmunitiesHtml}
                      </span>
                    </div>

                    <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                      <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Senses</span>
                      <span class="mon-stat-block__tidbit-data">
                        ${statBlock.sensesHtml}
                      </span>
                    </div>

                    <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                      <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Languages</span>
                      <span class="mon-stat-block__tidbit-data">
                        ${statBlock.languagesHtml}
                      </span>
                    </div>

                    <div class="mon-stat-block__tidbit-container">
                      <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                        <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Challenge</span>
                        <span class="mon-stat-block__tidbit-data">
                          ${statBlock.challengeRatingHtml}
                        </span>
                      </div>

                      <div class="mon-stat-block__tidbit-spacer"></div>
                      <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                        <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Proficiency Bonus</span>
                        <span class="mon-stat-block__tidbit-data">
                            ${statBlock.proficiencyBonusHtml}
                        </span>
                      </div>

                    </div>

                  </div>

                  <div class="mon-stat-block__separator">
                    <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                  </div>
                  
                  <div class="mon-stat-block__description-blocks ddbc-creature-block__description-blocks">

                    <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                      <div class="mon-stat-block__description-block-content">
                        ${statBlock.specialTraitsDescription}
                      </div>
                    </div>

                    <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                      <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Actions</div>
                      <div class="mon-stat-block__description-block-content">
                        ${statBlock.actionsDescription}
                      </div>
                    </div>
                    
                    <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                        <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Bonus Actions</div>
                        <div class="mon-stat-block__description-block-content">
                          ${statBlock.bonusActionsDescription}
                        </div>
                    </div>

                    <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                        <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Reactions</div>
                        <div class="mon-stat-block__description-block-content">
                          ${statBlock.reactionsDescription}
                        </div>
                    </div>

                    <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                        <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Legendary Actions</div>
                        <div class="mon-stat-block__description-block-content">
                          ${statBlock.legendaryActionsDescription}
                        </div>
                    </div>

                    <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                        <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Mythic Actions</div>
                        <div class="mon-stat-block__description-block-content">
                          ${statBlock.mythicActionsDescription}
                        </div>
                    </div>


                  </div>
                </div>




                <div class="image" style="display: block;"></div>

                <div class="more-info-content" style="padding:10px;">

                  <div class="mon-details__description-block">
                    <h3 class="mon-details__description-block-heading">Description</h3>
                    <div class="mon-details__description-block-content">
                        ${statBlock.characteristicsDescription}
                    </div>
                  </div>
                  
                  <div class="mon-details__description-block">
                    <div class="mon-details__description-block-content">
                        ${statBlock.lairDescription}
                    </div>
                  </div>
                  
                  

                </div>

                <footer>
                    ${statBlock.sourceBookHtml}
                </footer>

              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
    `;
  }

  statblockData = add_aoe_to_statblock(statblockData);
  return statblockData;
}

function build_monster_copy_stat_block(statBlock) {
    if (!statBlock.userHasAccess) {
        return `<div id='noAccessToContent' style='height: 100%;text-align: center;width: 100%;padding: 10px;font-weight: bold;color: #944;'>You do not have access to this content on DndBeyond.</div>`;
    }
    let statblockData = '';
    if(get_avtt_setting_value('statBlockStyle') == 0 && statBlock.data.initiativeBonus != null || get_avtt_setting_value('statBlockStyle') == 2){
      statblockData = `
          <div id="content" class="main content-container" style="padding:0!important">
            <section class="primary-content" role="main">

              <div class="monster-details">

                <div class="more-info details-more-info" style="padding: 2px;">
                  <div class="detail-content">  
                    <div class='nohide'>          

                      <div class="stat-block">
                          <div class="mon-stat-block-2024__header">
                              <div class="mon-stat-block-2024__name">
                                  <a class="mon-stat-block-2024__name-link" href="${statBlock.data.url}" target="_blank">
                                    ${statBlock.data.name}
                                  </a>
                              </div>

                               <div class="mon-stat-block__meta ddbc-creature-block__meta">${statBlock.sizeName} ${statBlock.monsterTypeHtml}, ${statBlock.alignmentName}</div>
                          </div>
                          <div class="mon-stat-block__attributes">
                            <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                              <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Armor Class</span>
                              <span class="mon-stat-block__attribute-value">
                                <span class="mon-stat-block__attribute-data-value">
                                    ${statBlock.data.armorClass}
                                </span>
                                <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                                    ${statBlock.data.armorClassDescription}
                                </span>
                              </span>
                              <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Initiative</span>
                              <span class="mon-stat-block__attribute-value">
                                <span class="mon-stat-block__attribute-data-value">
                                    ${statBlock.initiativeButton() }
                                </span>
                                ${statBlock.data.initiativeBonus != null ? `<span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                                    (${statBlock.data.initiativeBonus + 10})
                                </span>` : ``}   
                              </span>        
                            </div>
                            <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                              <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Hit Points</span>
                              <span class="mon-stat-block__attribute-data">
                                <span class="mon-stat-block__attribute-data-value">
                                    ${statBlock.data.averageHitPoints}
                                </span>
                                <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                                    (${statBlock.data.hitPointDice.diceString})
                                </span>
                              </span>
                            </div>
                            <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                              <span class="mon-stat-block__attribute-label">Speed</span>
                              <span class="mon-stat-block__attribute-data">
                                <span class="mon-stat-block__attribute-data-value">
                                    ${statBlock.speedDescription}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div class="stats">
                              <table class="abilities-saves physical">
                                  <thead>
                                      <tr>
                                          <th>
                                          </th><th>
                                          </th><th>Mod</th>
                                          <th>Save</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      <tr>                             
                                          <th>STR</th>
                                          <td>${statBlock.str}</td>
                                          <td class="modifier">${statBlock.statButton(statBlock.str, "STR", false)}</td>
                                          <td class="modifier">${statBlock.saveButton(statBlock.strSave, "STR")}</td>
                                      </tr>
                                      <tr>
                                          <th>DEX</th>
                                          <td>${statBlock.dex}</td>
                                          <td class="modifier">${statBlock.statButton(statBlock.dex, "DEX", false)}</td>
                                          <td class="modifier">${statBlock.saveButton(statBlock.dexSave, "DEX")}</td>
                                      </tr>
                                      <tr>
                                          <th>CON</th>
                                          <td>${statBlock.con}</td>
                                          <td class="modifier">${statBlock.statButton(statBlock.con, "CON", false)}</td>
                                          <td class="modifier">${statBlock.saveButton(statBlock.conSave, "CON")}</td>
                                      </tr>
                                  </tbody>
                              </table>
                              <table class="abilities-saves mental">
                                  <thead>
                                      <tr>
                                          <th>
                                          </th><th>
                                          </th><th>Mod</th>
                                          <th>Save</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      <tr>
                                          <th>INT</th>
                                          <td>${statBlock.int}</td>
                                          <td class="modifier">${statBlock.statButton(statBlock.int, "INT", false)}</td>
                                          <td class="modifier">${statBlock.saveButton(statBlock.intSave, "INT")}</td>
                                      </tr>
                                      <tr>
                                          <th>WIS</th>
                                          <td>${statBlock.wis}</td>
                                          <td class="modifier">${statBlock.statButton(statBlock.wis, "WIS", false)}</td>
                                          <td class="modifier">${statBlock.saveButton(statBlock.wisSave, "WIS")}</td>
                                      </tr>
                                      <tr>
                                          <th>CHA</th>
                                          <td>${statBlock.cha}</td>
                                          <td class="modifier">${statBlock.statButton(statBlock.cha, "CHA", false)}</td>
                                          <td class="modifier">${statBlock.saveButton(statBlock.chaSave, "CHA")}</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                          <div class="mon-stat-block__tidbits">



                            <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                              <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Skills</span>
                              <span class="mon-stat-block__tidbit-data">
                                ${statBlock.skillsHtml}
                              </span>
                            </div>
                            <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                              <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Gear</span>
                              <span class="mon-stat-block__tidbit-data">
                                ${statBlock.gearHtml}
                              </span>
                            </div>
                            <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                              <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Vulnerabilities</span>
                              <span class="mon-stat-block__tidbit-data">
                                ${statBlock.damageVulnerabilitiesHtml}
                              </span>
                            </div>
                            <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                              <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Resistances</span>
                              <span class="mon-stat-block__tidbit-data">
                                ${statBlock.damageResistancesHtml}
                              </span>
                            </div>

                            <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                              <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Immunities</span>
                              <span class="mon-stat-block__tidbit-data">
                                ${statBlock.damageImmunitiesHtml}
                              </span>
                            </div>

                            <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                              <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Condition Immunities</span>
                              <span class="mon-stat-block__tidbit-data">
                                ${statBlock.conditionImmunitiesHtml}
                              </span>
                            </div>

                            <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                              <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Senses</span>
                              <span class="mon-stat-block__tidbit-data">
                                ${statBlock.sensesHtml}
                              </span>
                            </div>

                            <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                              <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Languages</span>
                              <span class="mon-stat-block__tidbit-data">
                                ${statBlock.languagesHtml}
                              </span>
                            </div>

                            <div class="mon-stat-block__tidbit-container">
                              <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                                <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Challenge</span>
                                <span class="mon-stat-block__tidbit-data">
                                  ${statBlock.challengeRatingHtml}
                                </span>
                              </div>

                              <div class="mon-stat-block__tidbit-spacer"></div>
                              <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                                <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Proficiency Bonus</span>
                                <span class="mon-stat-block__tidbit-data">
                                    ${statBlock.proficiencyBonusHtml}
                                </span>
                              </div>

                            </div>

                          </div>

                         
                          
                          <div class="mon-stat-block__description-blocks ddbc-creature-block__description-blocks">

                            <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                              <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Traits</div>
                              <div class="mon-stat-block__description-block-content">
                                ${statBlock.specialTraitsDescription}
                              </div>
                            </div>

                            <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                              <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Actions</div>
                              <div class="mon-stat-block__description-block-content">
                                ${statBlock.actionsDescription}
                              </div>
                            </div>
                            
                            <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                                <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Bonus Actions</div>
                                <div class="mon-stat-block__description-block-content">
                                  ${statBlock.bonusActionsDescription}
                                </div>
                            </div>

                            <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                                <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Reactions</div>
                                <div class="mon-stat-block__description-block-content">
                                  ${statBlock.reactionsDescription}
                                </div>
                            </div>

                            <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                                <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Legendary Actions</div>
                                <div class="mon-stat-block__description-block-content">
                                  ${statBlock.legendaryActionsDescription}
                                </div>
                            </div>

                            <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                                <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Mythic Actions</div>
                                <div class="mon-stat-block__description-block-content">
                                  ${statBlock.mythicActionsDescription}
                                </div>
                            </div>
                          </div>
                      </div>    
                    </div>          
                  </div>
                </div>
              </div>
            </section>
          </div>
      `
    }
    else{
      statblockData = `
          <div id="content" class="main content-container" style="padding:0!important">
            <section class="primary-content" role="main">

              <div class="monster-details">

                <div class="more-info details-more-info" style="padding: 2px;">
                  <div class="detail-content">

                    <div class="mon-stat-block ddbc-creature-block" style="column-count: 1;margin:0;">
                      <div class="mon-stat-block__header ddbc-creature-block__header">
                        <div class="mon-stat-block__name ddbc-creature-block__name">
                          <a class="mon-stat-block__name-link ddbc-creature-block__name-link" href="${statBlock.data.url}" target="_blank">
                            ${statBlock.data.name}
                          </a>
                        </div>

                        <div class="mon-stat-block__meta ddbc-creature-block__meta">${statBlock.sizeName} ${statBlock.monsterTypeHtml}, ${statBlock.alignmentName}</div>
                      </div>
                      <div class="mon-stat-block__separator ddbc-creature-block__separator">
                        <img class="mon-stat-block__separator-img ddbc-creature-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                      </div>
                      <div class="mon-stat-block__attributes">
                        <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                          <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Armor Class</span>
                          <span class="mon-stat-block__attribute-value">
                            <span class="mon-stat-block__attribute-data-value">
                                ${statBlock.data.armorClass}
                            </span>
                            <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                                ${statBlock.data.armorClassDescription}
                            </span>
                          </span>
                          <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Initiative</span>
                          <span class="mon-stat-block__attribute-value">
                            <span class="mon-stat-block__attribute-data-value">
                                ${statBlock.initiativeButton() }
                            </span>
                            ${statBlock.data.initiativeBonus != null ? `<span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                                ${statBlock.data.initiativeBonus + 10}
                            </span>` : ``}   
                          </span>        
                        </div>
                        <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                          <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Hit Points</span>
                          <span class="mon-stat-block__attribute-data">
                            <span class="mon-stat-block__attribute-data-value">
                                ${statBlock.data.averageHitPoints}
                            </span>
                            <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                                (${statBlock.data.hitPointDice.diceString})
                            </span>
                          </span>
                        </div>
                        <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                          <span class="mon-stat-block__attribute-label">Speed</span>
                          <span class="mon-stat-block__attribute-data">
                            <span class="mon-stat-block__attribute-data-value">
                                ${statBlock.speedDescription}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div class="mon-stat-block__stat-block">
                        <div class="mon-stat-block__separator">
                          <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                        </div>
                        <div class="ability-block ddbc-creature-block__abilities">
                          <div class="ability-block__stat ability-block__stat--str ddbc-creature-block__ability-stat">
                            <div class="ability-block__heading ddbc-creature-block__ability-heading">STR</div>
                            <div class="ability-block__data">
                              <span class="ability-block__score">${statBlock.str}</span>
                              <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.str, "STR")}</span>
                            </div>
                          </div>
                          <div class="ability-block__stat ability-block__stat--dex ddbc-creature-block__ability-stat">
                            <div class="ability-block__heading ddbc-creature-block__ability-heading">DEX</div>
                            <div class="ability-block__data">
                              <span class="ability-block__score">${statBlock.dex}</span>
                              <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.dex, "DEX")}</span>
                            </div>
                          </div>
                          <div class="ability-block__stat ability-block__stat--con ddbc-creature-block__ability-stat">
                            <div class="ability-block__heading ddbc-creature-block__ability-heading">CON</div>
                            <div class="ability-block__data">
                              <span class="ability-block__score">${statBlock.con}</span>
                              <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.con, "CON")}</span>
                            </div>
                          </div>
                          <div class="ability-block__stat ability-block__stat--int ddbc-creature-block__ability-stat">
                            <div class="ability-block__heading ddbc-creature-block__ability-heading">INT</div>
                            <div class="ability-block__data">
                              <span class="ability-block__score">${statBlock.int}</span>
                              <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.int, "INT")}</span>
                            </div>
                          </div>
                          <div class="ability-block__stat ability-block__stat--wis ddbc-creature-block__ability-stat">
                            <div class="ability-block__heading ddbc-creature-block__ability-heading">WIS</div>
                            <div class="ability-block__data">
                              <span class="ability-block__score">${statBlock.wis}</span>
                              <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.wis, "WIS")}</span>
                            </div>
                          </div>
                          <div class="ability-block__stat ability-block__stat--cha ddbc-creature-block__ability-stat">
                            <div class="ability-block__heading ddbc-creature-block__ability-heading">CHA</div>
                            <div class="ability-block__data">
                              <span class="ability-block__score">${statBlock.cha}</span>
                              <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.cha, "CHA")}</span>
                            </div>
                          </div>
                        </div>
                        <div class="mon-stat-block__separator">
                          <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                        </div>
                      </div>
                      <div class="mon-stat-block__tidbits">

                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Saving Throws</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.savingThrowsHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Skills</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.skillsHtml}
                          </span>
                        </div>
                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Gear</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.gearHtml}
                          </span>
                        </div>
                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Vulnerabilities</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.damageVulnerabilitiesHtml}
                          </span>
                        </div>
                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Resistances</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.damageResistancesHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Immunities</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.damageImmunitiesHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Condition Immunities</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.conditionImmunitiesHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Senses</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.sensesHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                          <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Languages</span>
                          <span class="mon-stat-block__tidbit-data">
                            ${statBlock.languagesHtml}
                          </span>
                        </div>

                        <div class="mon-stat-block__tidbit-container">
                          <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                            <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Challenge</span>
                            <span class="mon-stat-block__tidbit-data">
                              ${statBlock.challengeRatingHtml}
                            </span>
                          </div>

                          <div class="mon-stat-block__tidbit-spacer"></div>
                          <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                            <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Proficiency Bonus</span>
                            <span class="mon-stat-block__tidbit-data">
                                ${statBlock.proficiencyBonusHtml}
                            </span>
                          </div>

                        </div>

                      </div>

                      <div class="mon-stat-block__separator">
                        <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                      </div>
                      
                      <div class="mon-stat-block__description-blocks ddbc-creature-block__description-blocks">

                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                          <div class="mon-stat-block__description-block-content">
                            ${statBlock.specialTraitsDescription}
                          </div>
                        </div>

                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                          <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Actions</div>
                          <div class="mon-stat-block__description-block-content">
                            ${statBlock.actionsDescription}
                          </div>
                        </div>
                        
                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                            <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Bonus Actions</div>
                            <div class="mon-stat-block__description-block-content">
                              ${statBlock.bonusActionsDescription}
                            </div>
                        </div>

                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                            <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Reactions</div>
                            <div class="mon-stat-block__description-block-content">
                              ${statBlock.reactionsDescription}
                            </div>
                        </div>

                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                            <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Legendary Actions</div>
                            <div class="mon-stat-block__description-block-content">
                              ${statBlock.legendaryActionsDescription}
                            </div>
                        </div>

                        <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                            <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Mythic Actions</div>
                            <div class="mon-stat-block__description-block-content">
                              ${statBlock.mythicActionsDescription}
                            </div>
                        </div>


                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        `;
    }

    return statblockData;
}
class MonsterStatBlock {
    constructor(data) {
        this.data = data;
    }

    findObj(key, id) {
        return window.ddbConfigJson[key]?.find(obj => obj.id === id);
    }

    get userHasAccess() {
        return this.data.isReleased || this.data.isHomebrew;
    }

    get hitPointDiceString() {
        return this.data.hitPointDice?.diceString || "";
    }

    get sizeObj() {
        return this.findObj("creatureSizes", this.data.sizeId);
    }
    get sizeName() {
        return this.data.size?.name || this.data.size || this.sizeObj?.name || "";
    }
    get typeObj() {
        return this.findObj("monsterTypes", this.data.typeId);
    }
    get typeName() {
        return this.data.type?.name ||this.data.type || this.typeObj?.name || "";
    }
    get monsterTypeHtml() {
        if (!this.data.subTypes || this.data.subTypes.length === 0) {
            return this.typeName;
        }
        const subtypeString = this.data.subTypes.map(id => this.findObj("monsterSubTypes", id).name).join(", ");
        return `${this.typeName} (${subtypeString})`
    }

    get alignmentObj() {
        return this.findObj("alignments", this.data.alignmentId);
    }
    get alignmentName() {
        return this.data.alignment || this.alignmentObj?.name || "";
    }

    get speedDescription() {
        return this.data.movements.map(m => {
            const obj = this.findObj("movements", m.movementId);
            if (obj.name === "Walk") {
                return `${m.speed} ft.`; // DDB doesn't display the "walk" label
            } else {
                return `${obj.name.toLowerCase()} ${m.speed} ft.`;
            }
        }).join(", ");
    }

    getStatById(id) {
        return this.data.stats.find(s => s.statId === id);
    }
    getStatValueById(id) {
        return this.getStatById(id)?.value || 10;
    }

    getSavingThrowbyId(id) {
        return this.data.savingThrows.find(s => s.statId === id);
    }

    getSavingThrowValueId(id) {
        return this.getSavingThrowbyId(id) != undefined ? this.proficiencyBonus : 0;
    }

    get str() { return this.getStatValueById(1); }
    get dex() { return this.getStatValueById(2); }
    get con() { return this.getStatValueById(3); }
    get int() { return this.getStatValueById(4); }
    get wis() { return this.getStatValueById(5); }
    get cha() { return this.getStatValueById(6); }

    get strSave() { return this.strMod + this.getSavingThrowValueId(1); }
    get dexSave() { return this.dexMod + this.getSavingThrowValueId(2); }
    get conSave() { return this.conMod + this.getSavingThrowValueId(3); }
    get intSave() { return this.intMod + this.getSavingThrowValueId(4); }
    get wisSave() { return this.wisMod + this.getSavingThrowValueId(5); }
    get chaSave() { return this.chaMod + this.getSavingThrowValueId(6); }

    get strMod() { return this.modInt(this.str); }
    get dexMod() { return this.modInt(this.dex); }
    get conMod() { return this.modInt(this.con); }
    get intMod() { return this.modInt(this.int); }
    get wisMod() { return this.modInt(this.wis); }
    get chaMod() { return this.modInt(this.cha); }

    get strModString() { return this.modString(this.str); }
    get dexModString() { return this.modString(this.dex); }
    get conModString() { return this.modString(this.con); }
    get intModString() { return this.modString(this.int); }
    get wisModString() { return this.modString(this.wis); }
    get chaModString() { return this.modString(this.cha); }

    get initiativeModString() {
      const init = this.data.initiativeBonus;
      if (isNaN(init)) {
        return 0; // not sure what to do here... send a number
      }
      if (init < 0) {
        return `${init}`;
      } else {
        return `+${init}`;
      }
    }

    modInt(value) {
        if (isNaN(value)) {
            return 0; // not sure what to do here... send a number
        }
        return Math.floor( (value - 10) / 2);
    }
    modString(value) {
        const m = this.modInt(value);
        if (m < 0) {
            return `${m}`;
        } else {
            return `+${m}`;
        }
    }

    saveString(value){
      if (value < 0) {
          return `${value}`;
      } else {
          return `+${value}`;
      }
    }

    initiativeButton(){
      return this.rollButton(`1d20`, this.data.initiativeBonus != null ? this.initiativeModString : this.dexModString, 'Roll', 'Initiative', false)                   
    }

    statButton(value, stat, parenthesis = true) {
        return this.rollButton("1d20", this.modString(value), "check", stat, parenthesis);
    }

    saveButton(value, stat) {
        return this.rollButton("1d20", this.saveString(value), "save", stat, false);
    }

    rollButton(expression, modifier, rollType, actionType, parenthesis = false) {
        const displayText = parenthesis ? `(${modifier})` : modifier;
        return `<button 
            data-exp="${expression}"
            data-mod="${modifier}"
            data-rolltype="${rollType}"
            data-actiontype="${actionType}"
            class="avtt-roll-button">${displayText}</button>`;
    }

    get proficiencyBonus() {
        return this.findObj("challengeRatings", this.data.challengeRatingId)?.proficiencyBonus || 2;
    }

    get savingThrowsHtml() {
        if (!this.data.savingThrows || this.data.savingThrows.length === 0) {
            return "<span class='hideme'></span>";
        }
        return this.data.savingThrows.map(st => {
            const statDefinition = this.findObj("stats", st.statId);
            const statValue = this.getStatValueById(st.statId);
            const bonusMod = st.bonusModifier || 0;
            const statModInt = this.modInt(statValue) + this.proficiencyBonus + bonusMod;
            const statModString = statModInt >= 0 ? `+${statModInt}` : `${statModInt}`;
            console.debug(`savingThrowsHtml`, statValue, bonusMod, statModString, statDefinition);
            return `${statDefinition.key} ${this.rollButton("1d20", statModString, "save", statDefinition.key)}`
        }).join(", ");
    }

    get skillsHtml() {
        if (typeof this.data.skillsHtml === "string" && this.data.skillsHtml.length > 0) {
            return this.data.skillsHtml; // data.skills isn't always correct. Or at least wasn't correct for Vecna
        }
        // we do this instead of using `data.skillsHtml` so we can alphabetize, but more importantly so we can inject the specific roll buttons
        if (!this.data.skills || this.data.skills.length === 0) {
            return "<span class='hideme'></span>";
        }
        return this.data.skills
            .map(s => {
                const definition = this.findObj("abilitySkills", s.skillId);
                const bonus = s.additionalBonus || 0;
                const total = s.value + bonus;
                const modifierString = total >= 0 ? `+${total}` : `${total}`;
                return { id: definition.id, modifierString: modifierString, name: definition.name };
            })
            .sort((lhs, rhs) => lhs.name.localeCompare(rhs.name))
            .map(obj => {
                const link = `<a class="tooltip-hover" href="/compendium/rules/basic-rules/using-ability-scores#${obj.name}" data-tooltip-href="//www.dndbeyond.com/skills/${obj.id}-tooltip?disable-webm=1&amp;disable-webm=1" target="_blank">${obj.name}</a>`
                const button = this.rollButton("1d20", obj.modifierString, "check", obj.name);
                return `${link} ${button}`;
            })
            .join(", ");
    }

    get gearHtml() {
      if (!this.data.gear || this.data.gear.length === 0) {
          return "<span class='hideme'></span>";
      }
      return this.data.gear
    }

    damageAdjustmentsHtml(damageAdjustmentType) {
        if (!this.data.damageAdjustments || this.data.damageAdjustments.length === 0) {
            return "<span class='hideme'></span>";
        }
        const objects = this.data.damageAdjustments
            .map(id => this.findObj("damageAdjustments", id))
            .filter(obj => obj.type === damageAdjustmentType)
            .sort((lhs, rhs) => lhs.displayOrder - rhs.displayOrder);
        if (!objects || objects.length === 0) {
            return "<span class='hideme'></span>";
        }
        return objects.map(obj => obj.name).join(", ");
    }
    get damageVulnerabilitiesHtml() {
      const damageVul = this.data.damage_vulnerabilities || this.data.resistances_and_immunities?.damage_vulnerabilities_display;
        if(damageVul){
          return damageVul.replace(/(?:^|\s)\w/g, function(match) {
              return match.toUpperCase();
          });
        }
        return this.damageAdjustmentsHtml(DAMAGE_ADJUSTMENT_TYPE_VULNERABILITIES);
    }
    get damageResistancesHtml() {
      const damageRes = this.data.damage_resistances || this.data.resistances_and_immunities?.damage_resistances_display;
        if(damageRes){
          return damageRes.replace(/(?:^|\s)\w/g, function(match) {
              return match.toUpperCase();
          });
        }
        return this.damageAdjustmentsHtml(DAMAGE_ADJUSTMENT_TYPE_RESISTANCE);
    }
    get damageImmunitiesHtml() {
      const damageImm = this.data.damage_immunities || this.data.resistances_and_immunities?.damage_immunities_display;
        if(damageImm){
          return damageImm.replace(/(?:^|\s)\w/g, function(match) {
              return match.toUpperCase();
          });
        }
        return this.damageAdjustmentsHtml(DAMAGE_ADJUSTMENT_TYPE_IMMUNITY);
    }

    get conditionImmunitiesHtml() {
        const condImm = this.data.condition_immunities || this.data.resistances_and_immunities?.condition_immunities_display;
        if(condImm){
          return condImm.replace(/(?:^|\s)\w/g, function(match) {
              return match.toUpperCase();
          });
        }
        if (typeof this.data.conditionImmunitiesHtml === "string" && this.data.conditionImmunitiesHtml.length > 0) {
            return this.data.conditionImmunitiesHtml;
        }
        if (!this.data.conditionImmunities || this.data.conditionImmunities.length === 0) {
            return "<span class='hideme'></span>";
        }
        const objects = this.data.conditionImmunities.map(id => window.ddbConfigJson.conditions?.find(obj => obj?.definition?.id === id).definition); // these objects are nested in a `definition` block for some reason
        if (!objects || objects.length === 0) {
            return "<span class='hideme'></span>";
        }
        return objects
            .map(definition => `<a class="tooltip-hover" href="/compendium/rules/basic-rules/appendix-a-conditions#${definition.name}" data-tooltip-href="//www.dndbeyond.com/conditions/${definition.id}-tooltip?disable-webm=1&amp;disable-webm=1" target="_blank">${definition.name}</a>`)
            .join(", ");
    }

    get sensesHtml() {
        // if (typeof this.data.sensesHtml === "string" && this.data.sensesHtml.length > 0) {
        //     return this.data.sensesHtml;
        // }
        const ppString = `Passive Perception ${this.data.passivePerception}`;
        if (!this.data.senses || this.data.senses.length === 0) {
            return ppString;
        }
        const sensesLinks = this.data.senses.map(sense => {
            const definition = this.findObj("senses", sense.senseId);
            const senseNotes = sense.notes || "";
            return `<a class="tooltip-hover sense-tooltip" href="/compendium/rules/basic-rules/monsters#${definition.name}" data-tooltip-href="//www.dndbeyond.com/senses/${definition.id}-tooltip?disable-webm=1&amp;disable-webm=1" target="_blank">${definition.name}</a> ${senseNotes}`
        }).join(", ");
        return `${sensesLinks}, ${ppString}`;
    }

    get languagesHtml() {
        if (!this.data.languages || this.data.languages.length === 0) {
            return "<span class='hideme'></span>";
        }
        if(typeof this.data.languages === "string"){
          return this.data.languages
        }
        return this.data.languages
            .map(l => {
                const definition = this.findObj("languages", l.languageId);
                if (typeof l.notes === "string" && l.notes.length > 0) {
                    return `${definition.name} ${l.notes}`;
                }
                return definition.name;
            })
            .sort((lhs, rhs) => lhs.localeCompare(rhs))
            .join(", ");
    }

    get challengeRatingHtml() {
      const definition = this.findObj("challengeRatings", this.data.challengeRatingId);  
      let crString = parseInt(definition.value);
      if(definition.value == 0.125){
        crString = `1/8`
      }
      else if(definition.value == 0.25){
        crString = `1/4`
      }
      else if(definition.value == 0.5){
        crString = `1/2`
      }
      return `${crString} (${definition.xp.toLocaleString()} XP)`;
    }

    get proficiencyBonusHtml() {
        const pb = this.proficiencyBonus;
        const modifier = pb >= 0 ? `+${pb}` : `${pb}`;
        return this.rollButton("1d20", modifier, "roll", "Proficiency Bonus");
    }

    get sourceBookHtml() {
        let html = `<p class="source monster-source">`;
        if (this.data.sourceId) {
            if(!this.data.document?.name){
              const definition = this.findObj("sources", this.data.sourceId);
              html += definition.description;
            }
            else{
              html += this.data.document?.name;
            }
            
            if (this.data.sourcePageNumber) {
                html += `, pg. ${this.data.sourcePageNumber}`;
            }
        }
        html += `</p>`;
        return html;
    }

    get specialTraitsDescription() {
        return this.stringOrHideMeHack(this.data.specialTraitsDescription);
    }

    get actionsDescription() {
        return this.stringOrHideMeHack(this.data.actionsDescription);
    }

    get bonusActionsDescription() {
        return this.stringOrHideMeHack(this.data.bonusActionsDescription);
    }

    get reactionsDescription() {
        return this.stringOrHideMeHack(this.data.reactionsDescription);
    }

    get legendaryActionsDescription() {
        return this.stringOrHideMeHack(this.data.legendaryActionsDescription);
    }

    get mythicActionsDescription() {
        return this.stringOrHideMeHack(this.data.mythicActionsDescription);
    }

    get characteristicsDescription() {
        return this.stringOrHideMeHack(this.data.characteristicsDescription);
    }

    get lairDescription() {
        return this.stringOrHideMeHack(this.data.lairDescription);
    }

    stringOrHideMeHack(str) {
        if (typeof str === "string" && str.length > 0) {
            return str;
        }
        return hidemeHack;
    }

    async imageHtml(token) {
        // const url = this.findBestAvatarUrl();
        const imageSrc = token?.options?.imgsrc?.startsWith('above-bucket-not-a-url') ? 
          await getAvttStorageUrl(token.options.imgsrc) : 
            (token?.options?.videoToken == undefined || token?.options?.imgsrc == this.data.avatarUrl) ? 
              this.data.largeAvatarUrl : 
                parse_img(token.options.imgsrc);
        let img = $(`<${(token?.options?.videoToken != undefined && (token?.options?.videoToken == true || ['.mp4', '.webm','.m4v'].some(d => token?.options?.imgsrc.includes(d)))) ? 'video disableremoteplayback muted' : 'img'}
            src="${imageSrc}"
            alt="${this.data.name}"
            class="monster-image"
            style="max-width: 100%;"
            data-large-avatar-url="${this.data.largeAvatarUrl}"
            data-avatar-url="${this.data.avatarUrl}"
            data-basic-avatar-url="${this.data.basicAvatarUrl}"
            data-current-avatar-url="largeAvatarUrl"
        />`);
        
        img.on("error", function (e) {
            let el = $(e.target)
            let cur = el.attr("data-current-avatar-url");
            let nextUrl;
            if (cur === "largeAvatarUrl") {
                nextUrl = el.attr("data-large-avatar-url");
                try {
                    let parts = nextUrl.split("/");
                    parts[parts.length - 2] = "1000";
                    parts[parts.length - 3] = "1000";
                    nextUrl = parts.join("/");
                    el.attr("data-current-avatar-url", "hacky");
                } catch (error) {
                    console.warn("imageHtml failed to hack the largeAvatarUrl", el, error);
                    nextUrl = el.attr("data-avatar-url");
                    el.attr("data-current-avatar-url", "avatarUrl");
                }
            } else if (cur === "hacky") {
                nextUrl = el.attr("data-avatar-url");
                el.attr("data-current-avatar-url", "avatarUrl");
            } else if (cur === "avatarUrl") {
                nextUrl = el.attr("data-basic-avatar-url");
                el.attr("data-current-avatar-url", "basicAvatarUrl");
            } else {
                console.warn("imageHtml failed to load image", el, e);
                return;
            }
            console.log("imageHtml failed to load image. Trying nextUrl", nextUrl, el, e);
            el.attr("src", nextUrl);
         });
      
      const html = $(`<div style="display: inline-block; position: relative;"></div>`);
      html.append(img);
      return html;
    }
}

function get_monster_senses(senses, vision = {darkvision: 0, devilsight: 0, truesight: 0}){
    if(senses.length > 0){
      const monsterSenseIds = {
        1 : 'truesight', //blind sight
        2 : 'darkvision',
        4 : 'truesight'
      }	
      for(let i=0; i < senses.length; i++){
        const senseKey = senses[i].senseId;
    
        const ftPosition = senses[i].notes.indexOf('ft.')
        
        const range = parseInt(senses[i].notes.slice(0, ftPosition));
        if(monsterSenseIds[senseKey] == undefined && range>vision.darkvision){
          vision.darkvision = range;
        } else{
          if(monsterSenseIds[senseKey] == 'darkvision'){
            const isDevilsight = senses[i].notes.match(/magical darkness|devil'?s?\s?sight/gi);
            if(isDevilsight){
              vision.devilsight = range;
              continue;
            }
              
          }
          vision[monsterSenseIds[senseKey]] = range;
        }
          
      }
    }
    return vision;
  
}

const hidemeHack = "<span class='hideme'></span>";

// not sure where to find these, but I've reversed engineered it by looking at this.data.damageAdjustments and window.ddbConfigJson.damageAdjustments
const DAMAGE_ADJUSTMENT_TYPE_RESISTANCE = 1;
const DAMAGE_ADJUSTMENT_TYPE_IMMUNITY = 2;
const DAMAGE_ADJUSTMENT_TYPE_VULNERABILITIES = 3;


const validRollTypes = ["to hit", "damage", "save", "check", "heal", undefined]; // undefined is in the list to allow clearing it

function getNonLegacySpellId(options){
    let newSpell
    if(options.tooltipName){
      newSpell = window.SPELLS_CACHE.filter(d=> d.definition.name.toLowerCase() == options.tooltipName && (!d.definition.isLegacy || d.definition.isHomebrew)); 
      return newSpell[0].definition.id;
    } else if(options.id){
        const spell = window.SPELLS_CACHE.filter(d=> d.definition.id == options.id);
        if(!spell[0]){
          return options.id;
        }
        const name = spell[0].definition.name.toLowerCase();
        newSpell = window.SPELLS_CACHE.filter(d=> d.definition.name.toLowerCase() == name && (!d.definition.isLegacy || d.definition.isHomebrew));
        options.tooltipName = name;
    }
    if(!newSpell[0]){
        console.warn('Legacy fallback', options)
        newSpell = window.ITEMS_CACHE.filter(d=> d.name.toLowerCase() == options.tooltipName && d.isLegacy);
    }
    if(!newSpell[0]){
      console.warn('Spell does not exist');
      return false;
    }
    return newSpell[0].definition.id;
}
function getNonLegacyItemId(options){
    let newItem 
    if(options.tooltipName){
      newItem = window.ITEMS_CACHE.filter(d=> d.name.toLowerCase() == options.tooltipName && (!d.isLegacy || d.isHomebrew)); 
      return newItem[0].id;
    } else if(options.id){
        const item =  window.ITEMS_CACHE.filter(d=> d.id == options.id);
        const name = item[0].name.toLowerCase();
        newItem = window.ITEMS_CACHE.filter(d=> d.name.toLowerCase() == name && (!d.isLegacy || d.isHomebrew));
        options.tooltipName = name;
    }
    if(!newItem[0]){
        console.warn('Legacy fallback', options)
        newItem = window.ITEMS_CACHE.filter(d=> d.name.toLowerCase() == options.tooltipName && d.isLegacy);
    }
    if(!newItem[0]){
      console.warn('Item does not exist', options);
      return false;
    }
    return newItem[0].id;
}
const fetch_tooltip = mydebounce(async (dataTooltipHref, name, callback, callbackTarget) => {
    // dataTooltipHref will look something like this `//www.dndbeyond.com/spells/2329-tooltip?disable-webm=1&disable-webm=1`
    // we only want the `spells/2329` part of that
    try {
      const homebrewTooltip = async function(){
        if(typeof dataTooltipHref[1] === 'string'){
          const parts = dataTooltipHref[1].split("/");
          const id = dataTooltipHref[1].match(/#.*$/gi) ? parts[parts.length-1] : parseInt(parts[parts.length-1]);
          const type = parts[parts.length-2];

          const typeAndId = `${type}/${id}`;
          const existingJson = window.tooltipCache[typeAndId];
          if (existingJson !== undefined) {
              console.log("fetch_tooltip existingJson", existingJson);
              callback(existingJson, callbackTarget);
              return;
          }
          window.tooltipCache[typeAndId] = {Tooltip: ``};
          let moreInfoString = await DDBApi.fetchMoreInfo(dataTooltipHref[1]);
          const parser = new DOMParser()

          // Parse the text
          let moreInfo = parser.parseFromString(moreInfoString, "text/html")
          let tooltipBody = $(moreInfo).find('.more-info');
          let bodyClass = $(moreInfo).find('body').attr('class');
          let subClasses = !tooltipBody.length && dataTooltipHref[1].match(/#.*$/gi) ? ['p-article-a', 'p-article-content'] : ['more-info', 'detail-content']
          if(!tooltipBody.length && dataTooltipHref[1].match(/#.*$/gi)){
            let section = $(moreInfo).find(dataTooltipHref[1].match(/#.*$/gi)[0]);
            if(section.length == 0){

              const toolTipJson = { Tooltip: '' }
              window.tooltipCache[typeAndId] = toolTipJson;
              callback(toolTipJson, callbackTarget); 
              return;
            } 
              
            let sectionElementType = $(moreInfo).find(dataTooltipHref[1].match(/#.*$/gi)[0])[0].tagName
            tooltipBody = $('<div>').append(section.nextUntil(`${sectionElementType}.heading-anchor`).addBack());
            
          }
          else if(!tooltipBody.length && $(moreInfo).find('.p-article-content').length>0){
            tooltipBody = $('<div>').append($(moreInfo).find('.p-article-content'));
          }
          else{
            tooltipBody.find('.ddb-homebrew-cant-publish').closest('ul').remove();
            tooltipBody.find('script,[class*="homebrew"],footer,div.image').remove();
            tooltipBody.find('.detail-content>.line:first-of-type').remove();
          }
          let functionArray = [];

          functionArray.reverse();
           for(let i =0; i<functionArray.length; i++){
            await functionArray[i]();
           }

         
          moreInfo = `
              <div class="tooltip tooltip-spell">
                <div class="tooltip-header">
                        <div class="tooltip-header-text">
                            <div class="tooltip-header-title">${name}</div>
                        </div>
                        <div class="tooltip-header-identifier tooltip-header-identifier-${type.replaceAll(/s$/gi, '')}">
                            ${type.replaceAll(/s$/gi, '').replace('-', ' ')}
                        </div>
                    </div>
              <div class="tooltip-body">
                <div class='${bodyClass}'>
                  <style id='embededStyles'>                         
                      .tooltip-flyout .tooltip-body{
                        .detail-content{
                          width: 100% !important;
                        }
                        .p-article-content>*,
                        .detail-content>*{
                          width:100%;
                        }
                        .more-info,.RPGMonster-listing .more-info,.RPGMagicItem-listing .more-info,.ihomebrewable-listing .more-info,.RPGSpell-listing .more-info,.IGear-listing .more-info,.RPGFeat-listing .more-info,.RPGBackground-listing .more-info,.RPGSubclass-listing .more-info {
                            position: relative;
                            top: -10px;
                            background-color: #fff;
                            border: none;
                            width: calc(100% - 2px);
                            margin: 0 auto;
                            padding: 5px 5px 0
                        }
                        .more-info::after{
                          display:none;
                        }
                        @media(min-width: 1024px) {
                             .more-info,.RPGMonster-listing .more-info,.RPGMagicItem-listing .more-info,.ihomebrewable-listing .more-info,.RPGSpell-listing .more-info,.IGear-listing .more-info,.RPGFeat-listing .more-info,.RPGBackground-listing .more-info,.RPGSubclass-listing .more-info {
                                width: calc(100% - 2px);
                                padding: 5px 5px 0;
                            }
                        }
                      }
                  </style>
                  <div class='${subClasses[0]}'>
                    <div class='${subClasses[1]}'> 
                     ${tooltipBody.html()}
                    </div>
                  </div>
                </div>
              </div>
          </div>`

          const toolTipJson = {Tooltip: moreInfo}
          window.tooltipCache[typeAndId] = toolTipJson;
          callback(toolTipJson, callbackTarget); 
        }
      }

      if (window.tooltipCache === undefined) {
          window.tooltipCache = {};
      }


      console.log("fetch_tooltip starting for ", dataTooltipHref);

      if(dataTooltipHref[0] != undefined){

        const parts = dataTooltipHref[0].split("/");
        const idIndex = parts.findIndex(p => p.includes("-tooltip"));
        let id = parseInt(parts[idIndex]);
        const type = parts[idIndex - 1] == 'equipment' ? 'adventuring-gear' : parts[idIndex - 1];
        if(get_avtt_setting_value('2024Tooltips')){
          if(type == 'spells')
            id= getNonLegacySpellId({id});
          else if(type == 'magic-items' || type == 'adventuring-gear')
            id = getNonLegacyItemId({id});
        }
        const typeAndId = `${type}/${id}`;
       
        const currSpell = type == 'spells' ? window.SPELLS_CACHE.filter(d=> d.definition.id == id)[0]?.definition : false;
        let isRitual, componentText;
        if(currSpell){
          isRitual = currSpell.ritual ?? false;
          componentText = currSpell.componentsDescription ?? '';
        }
       
        const existingJson = window.tooltipCache[typeAndId];
        if (existingJson !== undefined) {
          console.log("fetch_tooltip existingJson", existingJson);
          callback(existingJson, callbackTarget);
          return;
        }
        
        window.ajaxQueue.addRequest({
          url: `https://www.dndbeyond.com/${typeAndId}/tooltip`,
          beforeSend: function() {
            // only make the call if we don't have it cached.
            // This prevents the scenario where a user triggers `mouseenter`, and `mouseleave` multiple times before the first network request finishes
            const alreadyFetched = window.tooltipCache[typeAndId];
            if (alreadyFetched) {
                callback(alreadyFetched, callbackTarget);
                return false;
            }
            return true;
          },
          success: async function (response) {
            console.log("fetch_tooltip success", response);
            let responseJSON;
            try{
              responseJSON = JSON.parse(response.replace(/^[^{]*|[^}]*$/g, ""));
            }
            catch{
              if(typeof response === 'string'){

                homebrewTooltip()
                return;
              }
            }


            window.tooltipCache[typeAndId] = {...responseJSON, isRitual, componentText};
            callback(window.tooltipCache[typeAndId], callbackTarget);
          },
          error: function (error) {
            console.warn("fetch_tooltip error - attmpting more info link for homebrew/sources", error);
            homebrewTooltip()
            return;
          }
        });
      }  
      else{
        homebrewTooltip();
      }
    } catch(error) {
        console.warn("Failed to find tooltip info in", dataTooltipHref, error);
    }
}, 200);


function add_tooltip_aoe_buttons(html, tokenId){
  const icons = html.find(".aoe-size i:not('.above-vtt-visited')");
  if (icons.length > 0) {
    icons.wrap(function() {
  
      $(this).addClass("above-vtt-visited");
      const button = $("<button class='above-aoe integrated-dice__container'></button>");

      const spellContainer = $(this).closest('.tooltip-spell');
      const name = spellContainer.find(".tooltip-header-title").first().text();
      let color = "default"
      let feet = /([\d]+) ft/gi.exec(spellContainer.find('.aoe-size').text())[1];
      const dmgType = spellContainer.find(`[class*='-damage'] i[class*='i-type']`)?.attr('class')?.split('-')[2];
      if (dmgType != undefined && dmgType != ''){
        color = dmgType.toLowerCase();
      }
      let shape = $(this).attr('class').split(' ').filter(c => c.startsWith('i-aoe-'))[0].split('-')[2];
      shape = window.sanitize_aoe_shape(shape)

      button.attr("title", "Place area of effect token")
      button.attr("data-shape", shape);
      button.attr("data-style", color);
      button.attr("data-size", feet);
      button.attr("data-name", name);


      button.css("border-width","1px");
      button.click(function(e) {
        e.stopPropagation();
        const circleIsSquare = get_avtt_setting_value('circleIsSquare');
        let newShape = shape;
        let newFeet = feet;
        if(circleIsSquare && shape == 'circle'){
          newShape = 'square';
          newFeet *= 2;
        }
        let options = window.build_aoe_token_options(color, newShape, newFeet / window.top.CURRENT_SCENE_DATA.fpsq, name)
        if(name == 'Darkness' || name == 'Maddening Darkness' ){
          options = {
            ...options,
            darkness: true
          }
        }
        //if single token selected, place there:
        if(window.CURRENTLY_SELECTED_TOKENS.length == 1) {
          window.place_aoe_token_at_token(options, window.TOKEN_OBJECTS[window.top.CURRENTLY_SELECTED_TOKENS[0]]);
        } 
        else if(window.TOKEN_OBJECTS[tokenId] != undefined){
          window.place_aoe_token_at_token(options, window.TOKEN_OBJECTS[tokenId]);
        }
        else {
          window.place_aoe_token_in_centre(options)
        }
      })
      
      return button;
    });
    console.log(`${icons.length} aoe spells discovered`);
  }  
}

function display_tooltip(tooltipJson, container, hoverEvent, tokenId=undefined) {
    if (typeof tooltipJson?.Tooltip === "string") {
        remove_tooltip(0, false);

        console.log("container", container)
        const tooltipHtmlString = tooltipJson.Tooltip.replaceAll(/<script>[\S\s]+<\/script>/gi, '');


        build_and_display_sidebar_flyout(hoverEvent.clientY, function (flyout) {
            setup_tooltip_flyout(flyout, tooltipHtmlString, ['tooltip-flyout'], hoverEvent, {id: tokenId, container, isRitual: tooltipJson.isRitual, componentText: tooltipJson.componentText});
            flyout.css("background-color", "#fff");
        });
    }
}

var removeToolTipTimer = undefined;
function remove_tooltip(delay = 0, removeHoverNote = true) {
    clearTimeout(removeToolTipTimer);
    if (delay > 0) {
      removeToolTipTimer = setTimeout(function(){remove_sidebar_flyout(removeHoverNote)}, delay);
    } else {
      removeToolTipTimer = undefined;
      remove_sidebar_flyout(removeHoverNote);
    }
}

function add_stat_block_hover(statBlockContainer, tokenId) {
    const tooltip = $(statBlockContainer).find(".tooltip-hover");
    
    tooltip.hover(function (hoverEvent) {
        let currentTarget = $(hoverEvent.currentTarget);
        let cursorOffset = {
          left : 10,
          top  : -10
        }
        if (hoverEvent.type === "mouseenter") {
          clearTimeout(window.tooltipHoverTimeout);
          window.tooltipHoverTimeout = setTimeout(function(){
            currentTarget.css({
              '--cursor-offsetX': `${(hoverEvent.clientX + cursorOffset.left)}px`,
              '--cursor-offsetY': `${(hoverEvent.clientY + cursorOffset.top)}px`
            })
            let dataTooltipHref =[currentTarget.attr("data-tooltip-href"), currentTarget.attr("data-moreinfo")]; 
            let name = currentTarget.text()



            const callback = function (tooltipJson) {
                currentTarget.toggleClass('loading-tooltip', false);
                currentTarget.off('mousemove.cursor');
                let container = currentTarget.closest(".sidebar-flyout");
                if(container.find('.tooltip-header').length === 0){
                  container = currentTarget.closest("#resizeDragMon");
                }
                if (container.length === 0) {
                    container = currentTarget.closest(".sidebar-modal");
                }
                if (container.length === 0) {
                    container = is_characters_page() ? $(".ct-sidebar__inner [class*='styles_content']") : $(".sidebar__pane-content");
                }

                display_tooltip(tooltipJson, container, hoverEvent, tokenId);   
            };
            if(window.tooltipCache == undefined)
              window.tooltipCache = {};
            if(dataTooltipHref[0] != undefined){
              const parts = dataTooltipHref[0].split("/");
              const idIndex = parts.findIndex(p => p.includes("-tooltip"));
              const id = parseInt(parts[idIndex]);
              const type = parts[idIndex - 1];
              const typeAndId = `${type}/${id}`;

              const existingJson = window.tooltipCache[typeAndId];
              if (existingJson !== undefined) {
                console.log("fetch_tooltip existingJson", existingJson);
                callback(existingJson);
                return;
              }
            }
            else if(dataTooltipHref[1] != undefined){              
              const parts = dataTooltipHref[1].split("/");
              const id = dataTooltipHref[1].match(/#.*$/gi) ? parts[parts.length-1] : parseInt(parts[parts.length-1]);
              const type = parts[parts.length-2];

              const typeAndId = `${type}/${id}`;
              const existingJson = window.tooltipCache[typeAndId];
              if (existingJson !== undefined) {
                console.log("fetch_tooltip existingJson", existingJson);
                callback(existingJson);
                return;
              }
            }
            currentTarget.toggleClass('loading-tooltip', true);   
            fetch_tooltip(dataTooltipHref, name, callback);   
          }, 200);
        } else if (hoverEvent.type === "mousemove") {

          currentTarget.css({
            '--cursor-offsetX': `${(e.clientX + cursorOffset.left)}px`,
            '--cursor-offsetY': `${(e.clientY + cursorOffset.top)}px`
          })
        } else if (hoverEvent.type === "mouseleave") {
            clearTimeout(window.tooltipHoverTimeout); 
            remove_tooltip(500);
            currentTarget.toggleClass('loading-tooltip', false);
            currentTarget.off('mousemove.cursor');
        }
    });

}

function send_html_to_gamelog(outerHtml, whisper) {
    console.log("send_html_to_gamelog", outerHtml);
    outerHtml = outerHtml.replace('disableremoteplayback', 'disableremoteplayback autoplay loop');
    let html = window.MB.encode_message_text(outerHtml);
    const data = {
        player: window.PLAYER_NAME,
        img: window.PLAYER_IMG,
        text: html
    };
    if(whisper != undefined)
      data.whisper = whisper
    window.MB.inject_chat(data);
    notify_gamelog();
}
