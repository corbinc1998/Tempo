package dev.tempo.domain.ingest;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ingest service - upserts predictions from the Python predictor.
 *
 * Implementation TODO (left as the first feature for you to build):
 *
 *   1. Inject PredictionRepository and GameRepository.
 *
 *   2. For each PredictionPayload:
 *      - Verify the game exists (gameId in request must match a row in `game`)
 *      - Use a "save or update" pattern. Since prediction.game_id is unique,
 *        you can findByGameId then save (Spring Data treats save() as upsert when
 *        the entity has a non-null id).
 *      - Track inserted vs updated counts via the existence check.
 *
 *   3. Wrap the whole loop in a single transaction (the @Transactional below).
 *      If any record fails, the whole batch rolls back. This is usually what you
 *      want; if you'd rather partial success, you need a more careful design with
 *      per-record transactions and an error-collection pattern.
 *
 *   4. Log a structured INFO at the end with modelVersion and counts. CloudWatch
 *      Logs Insights queries on this field are how you'll know ingest is healthy.
 *
 * Bonus enhancements once basic ingest works:
 *   - Validate that home_win_prob is between 0 and 1
 *   - Reject if generatedAt is in the future (sanity check on the predictor's clock)
 *   - Publish a domain event after commit (Spring's @TransactionalEventListener) so
 *     other parts of the system can react - e.g. the BFF cache invalidation hook
 */
@Service
@RequiredArgsConstructor
public class IngestService {

    private static final Logger log = LoggerFactory.getLogger(IngestService.class);

    @Transactional
    public IngestController.IngestResult ingestPredictions(IngestController.IngestRequest request) {
        log.info("Ingest request received: modelVersion={}, count={}",
                request.modelVersion(), request.predictions().size());

        // TODO implement upsert. Return a placeholder for now.
        int total = request.predictions().size();
        return new IngestController.IngestResult(total, total, 0);
    }
}
