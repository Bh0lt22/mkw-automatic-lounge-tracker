export default {
        _meta: {
                name: '日本語',
                dir: 'ltr',
                code: 'ja'
        },

        text: {
                title: 'MKW Mogi Manager',
                loading: '読み込み中…',
                processing: '処理中…',
                save: '保存',
                confirm: '確認',
                cancel: 'キャンセル',
                blank: '—',

                landingPage: {
                        lead: 'キャプチャ → OCR → 集計をブラウザだけで。インストール不要・アップロード不要。',
                        features: ['オフラインOCR', 'DC対応', '手動割り当てと編集', 'Loungeエクスポート'],
                        steps: [
                                '【1】「はじめる」 を押して、12人のリストを貼り付け（`1. 名前 (12345 MMR)`）。',
                                '【2】プレビューで仮想ウェブカメラを選択。',
                                '【3】各レース後、スクリーンショットは自動または手動で取得されます。',
                                '【4】「編集」 → 「保存」 で修正。最後にスコアをエクスポート。',
                                '【5】キャプチャーカードがない場合は、「キャプチャーカードなし」で手動モードを使えます。'
                        ],
                        getStartedButton: '🚀 はじめる',
                        noCaptureCardButton: '🎮 キャプチャーカードなし',
                        forkFeaturesLabel: '🆕 フォークの新機能',
                        forkFeatures: [
                                '<strong>自動キャプチャ（レース終了）:</strong> レース中のシンボルが消えると自動キャプチャ — 手動スクリーンショット不要。',
                                '<strong>キャプチャーカードなしモード:</strong> 順位ごとにプレイヤーを選んで手動でスコアを記録。',
                                '<strong>OBS スコアオーバーレイ:</strong> OBS Browser Source 用の透過オーバーレイでチームスコアを表示。',
                                '<strong>チーム順位アイコン:</strong> 順位（1位〜6位）に応じたカスタムアイコン。',
                                '<strong>差分列・順位列</strong> をスコアボードに追加。',
                                '<strong>スマート自動入力</strong>: タグによるチーム照合と、手動修正用のOCRドロップダウン。',
                                '<strong>一覧編集時に過去のレースを自動再分析</strong>。',
                                '<strong>レースタイマー</strong>: レース中のシンボルで自動的に開始・停止・リセット。',
                                '<strong>IT / ES 翻訳</strong> を追加（EN/FR/DE/JA に加えて）。',
                                '<strong>一覧設定の簡素化</strong>: room・MMR・tier はオプションになりました。'
                        ],
                        notesLabel: '注意事項',
                        notes: [
                                'レース1は12名が必須です。',
                                '10人レースは有効。9人以下はやり直し。',
                                'FFA、2v2、3v3、4v4、6v6 のラウンジキュー形式に対応しています。',
                                'すべてブラウザ内で処理されます。',
                                '自動キャプチャ：レース終了を検出して自動でスクリーンショットを撮ります。'
                        ],
                        aboutLabel: '情報',
                        about: [
                                '作成: Bholt',
                                '作成: [Niet](https://github.com/PFQNiet)、協力者: TechyAlex',
                                '[ソースコードを見る](https://github.com/PFQNiet/mkw-lounge-tracker)',
                                '[不具合を報告](https://github.com/PFQNiet/mkw-lounge-tracker/issues)'
                        ]
                },

                rosterSetup: {
                        title: 'プレイヤー一覧の設定',
                        instructions: '{count}人のプレイヤーを貼り付けてください:',
                        wrongLength: '{count}人を想定しましたが、{actual}人になっています。',
                        badLine: '無効な行: 「{line}」',
                        rosterLoaded: '一覧を読み込みました！'
                },

                capture: {
                        camera: 'カメラ',
                        noCameras: '（カメラが見つかりません）',
                        selectCamera: '— カメラを選択 —',
                        cameraFallbackLabel: 'カメラ {deviceId}',
                        cameraStopped: 'カメラ停止',
                        cameraStarted: '開始: {label}',
                        cameraFailedToStart: '選択したカメラを開始できませんでした',
                        captureButton: '📸 キャプチャ & OCR',
                        localSaveReminder: '⚠️ Switch本体でもスクリーンショットを撮っておくと安心です！',
                        autoCaptureLabel: '自動キャプチャ',
                        useOverlay: "オーバーレイに接続",
                        lastCapture: '最新のキャプチャ',
                        ocrResult: 'OCR: 「{ocrText}」',
                        unresolved: '（未確定）',
                        maxRacesReached: 'レース数の上限に達しました。',
                        captureCancelled: 'キャプチャをキャンセルしました',
                        noScoreboardDetected: 'リザルト画面を検出できませんでした。リザルト画面をキャプチャしてください。',
                        noPauseScreenDetected: '名前が検出されません。ポーズ画面を開いてください。',
                        ocrFailed: 'OCRに失敗しました。詳細はコンソールをご確認ください。',
                        raceSaved: 'レース {number} を保存しました！'
                },

                overlay: {
                        connected: "オーバーレイに接続しました",
                        failed: "オーバーレイの接続に失敗しました",
                        title: "オーバーレイ接続",
                        about: "オーバーレイを使用するには、パソコン上でブリッジプログラムを実行する必要があります。",
                        firstTime: "初めて使用する場合は、[こちらの手順](https://github.com/PFQNiet/mkw-lounge-tracker/blob/master/obs-companion/README.md)に従って設定してください。",
                        instructions: "設定が完了している場合は、ブリッジが起動していることを確認してください。ブラウザで localhost への接続を拒否した場合は、サイト設定から権限を再度許可する必要があります。",
                        close: "閉じる"
                },

                manualResolution: {
                        title: '未確定プレイヤーの割り当て',
                        selectPlayer: '— プレイヤーを選択 —'
                },

                editRace: {
                        title: 'レースを編集',
                        instructions: '入れ替えるプレイヤーを2人選択してください。',
                        deleteRaceButton: 'レースを削除',
                        confirmDelete: 'このレースを完全に削除しますか？',
                        disconnectedPlace: 'DC',
                        uniquePlacementError: '1～12位は同じ順位を重複して選べません。',
                        raceUpdated: 'レース {number} を更新しました！',
                        raceDeleted: 'レース {number} を削除しました！'
                },

                editRoster: {
                        title: '一覧を編集',
                        team: 'チーム {id}',
                        tag: 'タグ',
                        loungeName: 'Lounge名',
                        ingameName: 'ゲーム内名',
                        substitute: '代理プレイヤー',
                        autodetect: '（自動検出）',
                        noSubstitute: '（なし）',
                        editSubButton: '編集',
                        autofill: '自動入力',
                        rosterUpdated: '一覧を更新しました！',
                        racesRematched: '{count} 件のレースを新しい一覧で再分析しました。',
                        resetNames: '↺ 名前をリセット',
                        confirmResetNames: 'すべてのゲーム内名とOCRキャッシュを消去しますか？元に戻せません。',
                        namesReset: 'すべてのゲーム内名を消去しました。'
                },

                substitutePlayer: {
                        title: 'プレイヤーを交代',
                        joinedAt: '参加レース番号',
                        newSubstitute: '新しい代理',
                        substituteUpdated: '代理情報を更新しました！'
                },

                scoreboard: {
                        title: 'スコアボード',
                        team: 'チーム',
                        player: 'プレイヤー',
                        raceNumber: 'R{number}',
                        total: '合計',
                        editRosterButton: '一覧を編集',
                        newSessionButton: '🧹 新規セッション',
                        snapshotScoresButton: "🖼️ スナップショット",
                        obsOverlayButton: '📺 OBS スコアオーバーレイ',
                        downloadZipButton: '📦 ZIP をダウンロード',
                        exportScoresButton: '📤 スコアをエクスポート'
                },

                noCapturePage: {
                        lead: 'キャプチャーカードなしでスコアを手動記録。順位ごとにプレイヤーを選択。',
                        steps: [
                                '<strong>1.</strong> メインモードと同様に12名の参加者リストを貼り付け。',
                                '<strong>2.</strong> レース列の下にある <em>スコアを保存</em> をクリック。',
                                '<strong>3.</strong> 各プレイヤーを1位、2位、… と順番に選択。最後の2枠には <em>DC</em>（切断）を使用可能。',
                                '<strong>4.</strong> 終わったらメインモードと同じくスコアをエクスポート。'
                        ]
                },

                noCapture: {
                        saveScoresButton: 'スコアを保存',
                        wizardTitle: 'レース {number} — スコアを保存',
                        selectPlace: '{place}位のプレイヤーを選択',
                        selectPlace1: '1位のプレイヤーを選択',
                        selectPlace2: '2位のプレイヤーを選択',
                        selectPlace3: '3位のプレイヤーを選択',
                        progress: '{done}/{total} 位置を割り当て済み',
                        allAssigned: '12位置すべて割り当て済み。保存をクリックして確定。',
                        undoButton: '↩ 元に戻す',
                        dcButton: '⚠ DC（切断）',
                        confirmOverwrite: 'レース {number} にはすでにスコアがあります。上書きしますか？',
                        noMorePlayers: 'DCとしてマークできるプレイヤーが残っていません。',
                        notAllAssigned: '保存する前に12位置すべてを割り当ててください。',
                        dc: 'DC'
                },

                exportScores: {
                        title: 'スコアをエクスポート',
                        format: '形式',
                        close: '閉じる',
                        copy: 'コピー',
                        copiedToClipboard: 'コピーしました！',
                        failedToCopy: 'コピーに失敗。Ctrl/Cmd+Cで手動コピーしてください。'
                },

                gallery: {
                        title: 'レース履歴',
                        imageAltText: 'レース {number} のキャプチャ',
                        imageCaption: 'レース {number} · {time}'
                }
        },

        format: {
                // 日本語は「n位」表記。1桁は桁揃えのためFIGURE SPACEを前に入れるときれい。
                ordinal() { return '位'; },
                /** @param {number} n */
                place(n) { return `${n < 10 ? '\u2007' : ''}${n}位`; },
                /** @param {number} n */
                number(n) { return n.toLocaleString('ja-JP'); },
                /** @param {Date} d */
                time(d) { return d.toLocaleTimeString('ja-JP', { timeStyle: 'short' }); }
        }
};
