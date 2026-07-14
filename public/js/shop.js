/* ============================================================
   SIMBIONTE — shop.js
   Renderiza la tienda (comida, regalos, artefactos, vestimentas)
   y resuelve las compras contra Wallet. Los consumibles se usan
   al instante; los equipables quedan en el inventario de la
   cuenta y se aplican a cada criatura nueva que nazca.
   ============================================================ */
"use strict";

const Shop = (() => {
  const CATALOG = [
    { cat: "food", icon: "✨", items: [
      { id: "food_spark", key: "shop.itemFood1" },
      { id: "food_feast", key: "shop.itemFood2" }
    ] },
    { cat: "gifts", icon: "💐", items: [
      { id: "gift_hearts", key: "shop.itemGift1" },
      { id: "gift_confetti", key: "shop.itemGift2" }
    ] },
    { cat: "artifacts", icon: "🔮", items: [
      { id: "art_amulet_social", key: "shop.itemArt1" },
      { id: "art_relic_glow", key: "shop.itemArt2" },
      { id: "art_shell_lifespan", key: "shop.itemArt3" }
    ] },
    { cat: "wear", icon: "👑", items: [
      { id: "wear_crown", key: "shop.itemWear1" },
      { id: "wear_collar", key: "shop.itemWear2" },
      { id: "wear_aura_gold", key: "shop.itemWear3" },
      { id: "wear_aura_violet", key: "shop.itemWear4" },
      { id: "wear_trail_sparkle", key: "shop.itemWear5" }
    ] }
  ];

  let onUse = null; // callback(itemId) para efectos instantáneos (consumibles)
  let onEquipChange = null; // callback() cuando cambia el inventario equipado

  function isConsumable(id) { return id.startsWith("food_") || id.startsWith("gift_"); }
  function isEquippable(id) { return id.startsWith("art_") || id.startsWith("wear_"); }

  function cardHTML(item, icon) {
    const price = Wallet.SHOP_ITEMS[item.id];
    const owned = Wallet.isOwned(item.id);
    const equipped = Wallet.isEquipped(item.id);
    let btnLabel, btnClass = "shop-card-btn";
    if (isConsumable(item.id)) { btnLabel = `${price} 💎`; }
    else if (owned) { btnLabel = I18n.t(equipped ? "shop.equipped" : "shop.equip"); btnClass += equipped ? " is-equipped" : ""; }
    else { btnLabel = `${price} 💎`; }
    return `
      <div class="shop-card${owned ? " is-owned" : ""}">
        <div class="shop-card-icon">${icon}</div>
        <div class="shop-card-body">
          <p class="shop-card-name">${I18n.t(item.key + ".name")}</p>
          <p class="shop-card-desc">${I18n.t(item.key + ".desc")}</p>
        </div>
        <button class="${btnClass}" data-item="${item.id}">${btnLabel}</button>
      </div>`;
  }

  function render() {
    const grid = document.getElementById("shop-grid");
    if (!grid) return;
    grid.innerHTML = CATALOG.map(group => `
      <div class="shop-cat">
        <p class="shop-cat-title">${I18n.t("shop.category." + group.cat)}</p>
        <div class="shop-cards">${group.items.map(it => cardHTML(it, group.icon)).join("")}</div>
      </div>`).join("");
    grid.querySelectorAll(".shop-card-btn[data-item]").forEach(el => {
      el.addEventListener("click", () => handleClick(el.dataset.item));
    });
  }

  async function handleClick(itemId) {
    if (isEquippable(itemId) && Wallet.isOwned(itemId)) {
      await Wallet.equip(itemId, !Wallet.isEquipped(itemId));
      render();
      if (onEquipChange) onEquipChange();
      return;
    }
    const result = await Wallet.purchase(itemId);
    if (result.error === "funds") { onToast?.(I18n.t("shop.notEnough"), "coral"); return; }
    if (result.error) return;
    if (isConsumable(itemId)) { if (onUse) onUse(itemId); }
    else if (onEquipChange) onEquipChange();
    onToast?.(I18n.t("shop.purchased", { name: I18n.t(CATALOG.flatMap(g => g.items).find(i => i.id === itemId).key + ".name") }));
    render();
  }

  let onToast = null;

  Wallet.onChange(() => render());
  if (typeof I18n !== "undefined") I18n.onChange(() => render());

  return {
    render,
    init({ onUseItem, onEquipmentChange, onToastMsg }) {
      onUse = onUseItem; onEquipChange = onEquipmentChange; onToast = onToastMsg;
      render();
    }
  };
})();
