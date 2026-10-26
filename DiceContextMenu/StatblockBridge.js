(function () {
	if (window.__abovevttStatblockBridgeInit) return;
	window.__abovevttStatblockBridgeInit = true;

	const bridge = new BroadcastChannel('abovevtt_statblock_bridge');

	let lastRollTime = 0;
	let lastButton = null;

	function getAbilityRollButtons(abilityBtn) {
		const abilityContainer = abilityBtn.closest('em, strong') || abilityBtn;
		const parent = abilityContainer.closest('p, div, section');
		if (!parent) return [];

		const allRollButtons = Array.from(
			parent.querySelectorAll('.avtt-roll-button:not([data-rolltype="recharge"]), .avtt-roll-formula-button')
		);
		if (allRollButtons.length === 0) return [];

		const allAbilities = Array.from(
			parent.querySelectorAll('.avtt-ability-roll-button, em > strong, strong > em')
		).filter(el => el === abilityBtn || el.classList.contains('avtt-ability-roll-button'));

		const thisIndex = allAbilities.indexOf(abilityBtn);
		const nextAbility = thisIndex >= 0 && thisIndex < allAbilities.length - 1 ? allAbilities[thisIndex + 1] : null;

		return allRollButtons.filter(btn => {
			const isAfter = (abilityContainer.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
			const isBeforeNext = !nextAbility || ((btn.compareDocumentPosition(nextAbility) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
			return isAfter && isBeforeNext;
		});
	}

	function handleRollEvent(e) {
		if (e.button === 2) return;

		const rollBtn = e.target.closest('.avtt-roll-button, .avtt-roll-formula-button');
		const abilityBtn = !rollBtn
			? e.target.closest('.avtt-ability-roll-button, p>em>strong, p>strong>em, div>strong>em, div>em>strong, p>span>em>strong, p>span>strong>em')
			: null;

		if (!rollBtn && !abilityBtn) return;
		if (abilityBtn && abilityBtn.textContent.includes('Recharge')) return;

		const targetBtn = rollBtn || abilityBtn;
		const now = Date.now();
		if (lastButton === targetBtn && (now - lastRollTime) < 300) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			return;
		}

		let abilityRollButtons = [];
		if (abilityBtn) {
			abilityRollButtons = getAbilityRollButtons(abilityBtn);
			if (abilityRollButtons.length === 0) return;
		}

		lastButton = targetBtn;
		lastRollTime = now;

		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();

		const statBlock = targetBtn.closest('.avtt-stat-block-container') || document.body;
		const nameEl = statBlock.querySelector('.mon-stat-block__name-link, .mon-stat-block__name, .character-name, .title_bar_text');
		const displayName = nameEl ? nameEl.textContent.trim() : '';
		const avatarEl = statBlock.querySelector('.mon-stat-block__avatar, .character-avatar, img.avatar, img.mon-stat-block__image');
		const imgUrl = avatarEl ? avatarEl.getAttribute('src') : '';
		const entityId = statBlock.getAttribute('data-token-id') || undefined;

		if (abilityBtn && abilityRollButtons.length > 0) {
			const aoeBtn = abilityBtn.closest('p, div')?.querySelector('.avtt-aoe-button');
			if (aoeBtn) aoeBtn.click();

			const rolls = [];
			for (const btn of abilityRollButtons) {
				if (btn.classList.contains('avtt-roll-formula-button')) continue;

				let expression = btn.getAttribute('data-exp') || '1d20';
				let modifier = (btn.getAttribute('data-mod') || '').replace(/[()]/g, '').trim();
				let rollType = btn.getAttribute('data-rolltype') || 'Roll';
				const action = btn.getAttribute('data-actiontype') || abilityBtn.textContent.replace(/\.$/, '').trim() || displayName;
				const save = btn.getAttribute('data-save') || undefined;
				const damageType = btn.getAttribute('data-damagetype') || undefined;
				modifier = (modifier === '0' && modifier !== '') ? '+0' : modifier;

				if (/^1d20/g.test(expression)) {
					if (e.altKey) {
						if (e.shiftKey) expression = '3d20kh1';
						else if (e.ctrlKey || e.metaKey) expression = '3d20kl1';
					} else if (e.shiftKey) {
						expression = '2d20kh1';
					} else if (e.ctrlKey || e.metaKey) {
						expression = '2d20kl1';
					}
				}

				rolls.push({
					expression: expression + modifier,
					action: action,
					rollType: rollType,
					displayName: displayName,
					imgUrl: imgUrl,
					entityType: 'monster',
					entityId: entityId,
					save: save,
					damageType: damageType
				});
			}

			if (rolls.length > 0) {
				bridge.postMessage({
					type: 'multiroll',
					rolls: rolls
				});
			}
			return;
		}

		if (rollBtn.classList.contains('avtt-roll-formula-button')) {
			const slashCommand = rollBtn.getAttribute('data-slash-command');
			if (slashCommand) {
				bridge.postMessage({
					type: 'slashCommand',
					command: slashCommand
				});
			}
			return;
		}

		let expression = rollBtn.getAttribute('data-exp') || '1d20';
		let modifier = (rollBtn.getAttribute('data-mod') || '').replace(/[()]/g, '').trim();
		let rollType = rollBtn.getAttribute('data-rolltype') || 'Roll';
		const action = rollBtn.getAttribute('data-actiontype') || rollBtn.getAttribute('title') || '';
		const save = rollBtn.getAttribute('data-save') || undefined;
		const damageType = rollBtn.getAttribute('data-damagetype') || undefined;
		modifier = (modifier === '0' && modifier !== '') ? '+0' : modifier;

		if (/^1d20/g.test(expression)) {
			if (e.altKey) {
				if (e.shiftKey) expression = '3d20kh1';
				else if (e.ctrlKey || e.metaKey) expression = '3d20kl1';
			} else if (e.shiftKey) {
				expression = '2d20kh1';
			} else if (e.ctrlKey || e.metaKey) {
				expression = '2d20kl1';
			}
		}

		bridge.postMessage({
			type: 'roll',
			rollData: {
				expression: expression + modifier,
				action: action,
				rollType: rollType,
				displayName: displayName,
				imgUrl: imgUrl,
				entityType: 'monster',
				entityId: entityId
			},
			save: save,
			damageType: damageType
		});
	}

	function handleContextMenu(e) {
		const btn = e.target.closest('.avtt-roll-button');
		if (!btn) return;
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();

		const expression = btn.getAttribute('data-exp') || '1d20';
		const modifier = (btn.getAttribute('data-mod') || '').replace(/[()]/g, '').trim();
		const rollType = btn.getAttribute('data-rolltype') || 'Roll';
		const actionType = btn.getAttribute('data-actiontype') || btn.getAttribute('title') || '';
		const damageType = btn.getAttribute('data-damagetype') || undefined;
		const save = btn.getAttribute('data-save') || undefined;

		const statBlock = btn.closest('.avtt-stat-block-container') || document.body;
		const nameEl = statBlock.querySelector('.mon-stat-block__name-link, .mon-stat-block__name, .character-name, .title_bar_text');
		const displayName = nameEl ? nameEl.textContent.trim() : '';
		const avatarEl = statBlock.querySelector('.mon-stat-block__avatar, .character-avatar, img.avatar, img.mon-stat-block__image');
		const imgUrl = avatarEl ? avatarEl.getAttribute('src') : '';
		const entityId = statBlock.getAttribute('data-token-id') || undefined;

		if (typeof standard_dice_context_menu === 'function') {
			if (rollType === "damage" || (expression !== "1d20" && !/^1d20/gi.test(expression))) {
				damage_dice_context_menu(expression + modifier, modifier, actionType, rollType, displayName, imgUrl, "monster", entityId, damageType, save)
					.present(e.clientY, e.clientX, document);
			} else {
				standard_dice_context_menu(expression + modifier, modifier, actionType, rollType, displayName, imgUrl, "monster", entityId)
					.present(e.clientY, e.clientX, document);
			}
		}
	}

	document.addEventListener('pointerdown', handleRollEvent, true);
	document.addEventListener('click', handleRollEvent, true);
	document.addEventListener('touchstart', handleRollEvent, true);
	document.addEventListener('contextmenu', handleContextMenu, true);
})();
