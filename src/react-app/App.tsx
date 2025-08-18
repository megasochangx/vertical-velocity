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

      // プレイヤーの設定
      const playerWidth = 60;
      const playerHeight = 60;
      const playerColor = 0xff0000;
      const key = {
        left: "KeyA",
        right: "KeyD",
        up: "KeyW",
        down: "KeyS",
        jump: "KeyJ",
        sprint: "KeyK"
      };
      const gravity = 0.3;
      let gravityMultiplier = 1;
      const jump = {
        ground: 15,
        air: 13,
        wall: 10,
        sprint: 3
      };
      const friction = {
        ground: 0.9,
        air: 0.975
      };
      const speed = {
        ground: 4,
        air: 6
      };
      const multiplier = {
        wallJump: 1.5,
        sprint: 2.5
      };
      const moveCooldown = {
        wallJump: 30,
        sprint: 40
      };

      // プレイヤーの状態
      let direction = 1;
      const velocity = { x: 0, y: 0 };
      const moveCoolCount = { wallJump: 0, sprint: 0 };
      let isOnGround = false;
      let isOnWall = false;
      let isDoubleJumped = false;
      let isJumpKeyPressed = false;
      let isSprintKeyPressed = false;

      // プレイヤーを作成
      const player = new Graphics();
      player.rect(0, 0, playerWidth, playerHeight);
      player.fill(playerColor);
      player.pivot.set(playerWidth / 2, playerHeight / 2);
      player.x = app.screen.width / 2;
      player.y = app.screen.height / 2;
      app.stage.addChild(player);

      const minY = playerHeight / 2;
      const maxY = app.screen.height - playerHeight / 2;
      const minX = playerWidth / 2;
      const maxX = app.screen.width - playerWidth / 2;

      // キー入力の状態を管理するオブジェクト
      const keys: { [key: string]: boolean } = {};

      // キーが押されたときの処理
      const onKeyDown = (e: KeyboardEvent) => {
        keys[e.code] = true;
      };

      // キーが離されたときの処理
      const onKeyUp = (e: KeyboardEvent) => {
        keys[e.code] = false;
        if (e.code === key.jump) {
          isJumpKeyPressed = false;
        }
        if (e.code === key.sprint) {
          isSprintKeyPressed = false;
        }
      };

      // ゲームループ
      const gameLoop = () => {
        // 落下速度の調整
        if (!isOnGround && velocity.y > 0) {
          if (keys[key.up]) {
            gravityMultiplier = 0.5;
          } else if (keys[key.down]) {
            gravityMultiplier = 2;
          } else {
            gravityMultiplier = 1;
          }
        } else {
          gravityMultiplier = 1;
        }
        // 移動
        if (moveCoolCount.sprint <= 0 && moveCoolCount.wallJump <= 0) {
          if (keys[key.left] && keys[key.right]) {
            velocity.x = 0;
          } else if (keys[key.left]) {
            if (velocity.x > -speed.air) {
              if (isOnGround) {
                velocity.x = -speed.ground;
              } else {
                velocity.x = -speed.air;
              }
            }
            direction = -1;
          } else if (keys[key.right]) {
            if (velocity.x < speed.air) {
              if (isOnGround) {
                velocity.x = speed.ground;
              } else {
                velocity.x = speed.air;
              }
            }
            direction = 1;
          }
        }
        if (keys[key.jump] && !isJumpKeyPressed) {
          if (isOnGround) {
            velocity.y = -jump.ground;
            isJumpKeyPressed = true;
          } else if (isOnWall && !isOnGround && moveCoolCount.wallJump <= 0) {
            velocity.x = speed.air * multiplier.wallJump * -direction;
            velocity.y = -jump.wall;
            isDoubleJumped = false;
            moveCoolCount.wallJump = moveCooldown.wallJump;
            direction = -direction;
            isJumpKeyPressed = true;
          } else if (!isDoubleJumped) {
            velocity.y = -jump.air;
            isDoubleJumped = true;
            isJumpKeyPressed = true;
          }
          isOnGround = false;
        }
        if (
          keys[key.sprint] &&
          !isSprintKeyPressed &&
          moveCoolCount.sprint <= 0 &&
          moveCoolCount.wallJump <= 0
        ) {
          velocity.x = speed.air * multiplier.sprint * direction;
          velocity.y = -jump.sprint;
          moveCoolCount.sprint = moveCooldown.sprint;
          isSprintKeyPressed = true;
        }

        // クールダウン
        if (moveCoolCount.sprint > 0) {
          moveCoolCount.sprint--;
        } else if (moveCoolCount.sprint < 0) {
          moveCoolCount.sprint = 0;
        }
        if (moveCoolCount.wallJump > 0) {
          moveCoolCount.wallJump--;
        } else if (moveCoolCount.wallJump < 0) {
          moveCoolCount.wallJump = 0;
        }

        // 移動
        if (isOnGround) {
          velocity.x *= friction.ground;
        } else {
          velocity.x *= friction.air;
        }
        if (Math.abs(velocity.x) < 0.05) {
          velocity.x = 0;
        }
        player.x += velocity.x;
        velocity.y += gravity * gravityMultiplier;
        player.y += velocity.y;

        // 地面との衝突判定
        if (player.y >= maxY) {
          player.y = maxY;
          velocity.y = 0;
          isOnGround = true;
          isDoubleJumped = false;
        } else if (player.y <= minY) {
          player.y = minY;
          velocity.y = 0;
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
        player.rotation += velocity.x * 0.03;
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
