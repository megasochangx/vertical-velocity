import { useEffect } from "react";
import { Application, Graphics } from "pixi.js";

function App() {
  useEffect(() => {
    // キャンバス要素を取得
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    
    // Pixiアプリケーション
    const app = new Application();
    (async () => {
      await app.init({
        canvas: canvas,
        width: 900,
        height: 1200
      });

      // プレイヤーを作成
      const player = new Graphics();
      const w = 60; // プレイヤーの幅
      const h = w; // プレイヤーの高さ
      player.rect(0, 0, w, h);
      player.fill(0xff0000);
      player.pivot.set(w / 2, h / 2);
      player.x = app.screen.width / 2;
      player.y = app.screen.height / 2;
      app.stage.addChild(player);

      let direction = 1; // 移動方向（1: 右, -1: 左）
      let velocityX = 0; // X方向の速度
      let velocityY = 0; // Y方向の速度
      const gravity = 0.3; // 重力
      let gravityModifier = 1; // 重力の倍率
      const groundJump = 15; // 地上ジャンプ力
      const airJump = 13; // 空中ジャンプ力
      const wallJump = 10; // 壁ジャンプ力
      const sprintJump = 3; // スプリントジャンプ力
      const groundFriction = 0.9; // 地上摩擦
      const airFriction = 0.975; // 空中摩擦
      const groundSpeed = 4; // 地上移動速度
      const airSpeed = 6; // 空中移動速度
      const wallJumpSpeed = 1.5; // 壁ジャンプ速度
      const sprintSpeed = 2.5; // スプリント速度倍率
      const minY = h / 2; // プレイヤーの最小Y座標
      const maxY = app.screen.height - h/2; // プレイヤーの最大Y座標
      const minX = w / 2; // プレイヤーの最小X座標
      const maxX = app.screen.width - w / 2; // プレイヤーの最大X座標
      const sprintCooldown = 40; // スプリントクールダウン時間
      let sprintCount = 0; // スプリントクールダウンカウント
      const wallJumpCooldown = 30; // 壁ジャンプクールダウン時間
      let wallJumpCount = 0; // 壁ジャンプクールダウンカウント
      let isOnGround = true; // 着地フラグ
      let isOnWall = false; // 壁に接触しているか
      let isDoubleJumped = false; // 空中ジャンプフラグ
      let isJumpKeyPressed = false; // ジャンプキーが押されたか
      let isSprintKeyPressed = false; // スプリントキーが押されたか

      // キー入力の状態を管理するオブジェクト
      const keys: { [key: string]: boolean } = {};

      // キーが押されたときの処理
      const onKeyDown = (e: KeyboardEvent) => {
        keys[e.code] = true;
      };

      // キーが離されたときの処理
      const onKeyUp = (e: KeyboardEvent) => {
        keys[e.code] = false;
        if (e.code === 'KeyJ') {
          isJumpKeyPressed = false;
        }
        if (e.code === 'KeyK') {
          isSprintKeyPressed = false;
        }
      };

      // ゲームループ
      const gameLoop = () => {
        // キー入力の処理
        if (keys['KeyW'] && velocityY > 0 && !isOnGround) {
          gravityModifier = 0.5;
        } else if (keys['KeyS'] && velocityY > 0 && !isOnGround) {
          gravityModifier = 2;
        } else {
          gravityModifier = 1;
        }
        if (sprintCount <= 0 && wallJumpCount <= 0) {
          if (keys['KeyA'] && keys['KeyD']) {
            velocityX = 0;
          } else if (keys['KeyA']) {
            if (velocityX > -airSpeed) {
              if (isOnGround) {
                velocityX = -groundSpeed;
              } else {
                velocityX = -airSpeed;
              }
            }
            direction = -1;
          } else if (keys['KeyD']) {
            if (velocityX < airSpeed) {
              if (isOnGround) {
                velocityX = groundSpeed;
              } else {
                velocityX = airSpeed;
              }
            }
            direction = 1;
          }
        }
        if (keys['KeyJ'] && !isJumpKeyPressed) {
          if (isOnGround) {
            velocityY = -groundJump;
            isJumpKeyPressed = true;
          } else if (isOnWall && !isOnGround && wallJumpCount <= 0) {
            velocityX = airSpeed * wallJumpSpeed * -direction;
            velocityY = -wallJump;
            isDoubleJumped = false;
            wallJumpCount = wallJumpCooldown;
            direction = -direction
            isJumpKeyPressed = true;
          } else if (!isDoubleJumped) {
            velocityY = -airJump;
            isDoubleJumped = true;
            isJumpKeyPressed = true;
          }
          isOnGround = false;
        }
        if (keys['KeyK'] && !isSprintKeyPressed && sprintCount <= 0 && wallJumpCount <= 0) {
          velocityX = airSpeed * sprintSpeed * direction;
          velocityY = -sprintJump;
          sprintCount = sprintCooldown;
          isSprintKeyPressed = true;
        }

        // クールダウン
        if (sprintCount > 0) {
          sprintCount--;
        } else if (sprintCount < 0) {
          sprintCount = 0;
        }
        if (wallJumpCount > 0) {
          wallJumpCount--;
        } else if (wallJumpCount < 0) {
          wallJumpCount = 0;
        }

        // 移動
        if (isOnGround) {
          velocityX *= groundFriction;
        } else {
          velocityX *= airFriction;
        }
        if (Math.abs(velocityX) < 0.05) {
          velocityX = 0;
        }
        player.x += velocityX;
        velocityY += gravity * gravityModifier;
        player.y += velocityY;

        // 地面との衝突判定
        if (player.y >= maxY) {
          player.y = maxY;
          velocityY = 0;
          isOnGround = true;
          isDoubleJumped = false;
        } else if (player.y <= minY) {
          player.y = minY;
          velocityY = 0;
        }

        // 境界チェック
        player.x = Math.max(minX, Math.min(maxX, player.x));
        player.y = Math.max(minY, Math.min(maxY, player.y));

        if (player.x <= minX || player.x >= maxX) {
          isOnWall = true;
        } else {
          isOnWall = false;
        }

        // キューブの回転
        player.rotation += velocityX * 0.03;
      };

      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);

      app.ticker.add(gameLoop);
    })()
  }, []);

  return (
    <>
      <h1 className="text-center m-3 select-none">Vertical Velocity</h1>
      <div className="flex justify-center">
        <canvas id="canvas"></canvas>
      </div>
    </>
  );
}

export default App;
