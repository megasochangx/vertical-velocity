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
      const moveKey = {
        left: "KeyA",
        right: "KeyD",
        up: "KeyW",
        down: "KeyS",
        jump: "KeyJ",
        sprint: "KeyK"
      };
      const gravity = 0.3;
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
      const moveFrames = {
        wallJump: 10,
        sprint: 10
      };

      // プレイヤーの状態
      let direction = 1;
      const velocity = {
        x: 0,
        y: 0
      };
      const moveTimer = {
        wallJump: 0,
        sprint: 0
      };
      const multiplier = {
        gravity: 1,
        wallJump: 1.5,
        sprint: 2.5
      };
      const canUseMove = {
        get wallJump() {
          return moveTimer.wallJump <= 0;
        },
        get sprint() {
          return moveTimer.sprint <= 0;
        }
      };
      const canHorizontalMove = () => canUseMove.wallJump && canUseMove.sprint;
      let isOnGround = false;
      let isOnWall = false;
      let isDoubleJumped = false;
      let isSprinted = false;
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
        if (e.code === moveKey.jump) {
          isJumpKeyPressed = false;
        }
        if (e.code === moveKey.sprint) {
          isSprintKeyPressed = false;
        }
      };

      // フレームごとに実行される処理
      const updatePerFrame = () => {
        // クールダウンの更新
        if (moveTimer.sprint > 0) {
          moveTimer.sprint--;
        } else if (moveTimer.sprint < 0) {
          moveTimer.sprint = 0;
        }
        if (moveTimer.wallJump > 0) {
          moveTimer.wallJump--;
        } else if (moveTimer.wallJump < 0) {
          moveTimer.wallJump = 0;
        }
      };

      // tickごとに実行される処理
      const updatePerTick = () => {
        // キー操作
        // 落下速度の調整
        if (!isOnGround && velocity.y > 0) {
          if (keys[moveKey.up] && !keys[moveKey.down]) {
            multiplier.gravity = 0.5;
          } else if (!keys[moveKey.up] && keys[moveKey.down]) {
            multiplier.gravity = 2;
          } else {
            multiplier.gravity = 1;
          }
        } else {
          multiplier.gravity = 1;
        }
        // 横移動
        if (canHorizontalMove()) {
          if (keys[moveKey.left] && !keys[moveKey.right]) {
            direction = -1;
            velocity.x = (isOnGround ? speed.ground : speed.air) * direction;
          } else if (!keys[moveKey.left] && keys[moveKey.right]) {
            direction = 1;
            velocity.x = (isOnGround ? speed.ground : speed.air) * direction;
          }
        }
        // ジャンプ系
        if (keys[moveKey.jump] && !isJumpKeyPressed) {
          if (isOnGround) {
            velocity.y = -jump.ground;
            isSprinted = false;
          } else if (isOnWall && !isOnGround && canUseMove.wallJump) {
            velocity.x = speed.air * multiplier.wallJump * -direction;
            velocity.y = -jump.wall;
            moveTimer.wallJump = moveFrames.wallJump;
            direction = -direction;
            isSprinted = false;
          } else if (!isDoubleJumped) {
            velocity.y = -jump.air;
            isDoubleJumped = true;
            isSprinted = false;
          }
          isOnGround = false;
          isJumpKeyPressed = true;
        }
        // スプリント
        if (keys[moveKey.sprint] && !isSprintKeyPressed && canHorizontalMove() && !isSprinted) {
            velocity.x = speed.air * multiplier.sprint * direction;
            velocity.y = -jump.sprint;
            moveTimer.sprint = moveFrames.sprint;
            isSprintKeyPressed = true;
            isSprinted = true;
        }

        // 移動処理
        if (isOnGround) {
          velocity.x *= friction.ground;
        } else {
          velocity.x *= friction.air;
        }
        if (Math.abs(velocity.x) < 0.05) {
          velocity.x = 0;
        }
        player.x += velocity.x;
        velocity.y += gravity * multiplier.gravity;
        player.y += velocity.y;

        // 地面との衝突判定
        if (player.y >= maxY) {
          player.y = maxY;
          velocity.y = 0;
          isOnGround = true;
          isDoubleJumped = false;
          isSprinted = false;
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

      
      // ゲームスピードの固定
      let lastFrameTime = performance.now();
      const frameInterval = 1000 / 60;

      const gameLoop = () => {
        updatePerTick();
        const now = performance.now();
        if (now - lastFrameTime >= frameInterval) {
          updatePerFrame();
          lastFrameTime = now;
        }
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
