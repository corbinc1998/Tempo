package dev.tempo.domain.ingest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Ingest endpoint - the seam between your Python predictor and the Java system of record.
 *
 * Contract:
 *   POST /api/v1/ingest/predictions
 *   Header: X-Ingest-Key: <secret>
 *   Body:   { "modelVersion": "...", "predictions": [...] }
 *
 *   Returns: { "received": N, "inserted": M, "updated": K }
 *
 * Auth model:
 *   IngestApiKeyFilter intercepts before this controller runs. If the header is missing
 *   or wrong, the filter responds 401 and the controller never sees the request.
 *
 * Idempotency:
 *   Predictions are unique per game_id (DB constraint). Re-posting the same payload
 *   should produce updates, not duplicates. The service handles upsert.
 */
@RestController
@RequestMapping("/api/v1/ingest")
@RequiredArgsConstructor
@Tag(name = "Ingest", description = "Endpoints for the Python predictor")
@SecurityRequirement(name = "ingestKey")
public class IngestController {

    private final IngestService ingestService;

    @PostMapping("/predictions")
    @Operation(summary = "Ingest a batch of predictions from the Python predictor")
    public IngestResult ingestPredictions(@Valid @RequestBody IngestRequest request) {
        return ingestService.ingestPredictions(request);
    }

    /**
     * Request body shape. Matches the Python predictor's output.
     *
     * Tip: when the Python side is a separate service, version both ends together.
     * Add a `clientVersion` field if you ever need to vary parsing behavior.
     */
    public record IngestRequest(
            @NotEmpty String modelVersion,
            @NotNull List<PredictionPayload> predictions
    ) {}

    public record PredictionPayload(
            @NotNull Long gameId,
            @NotNull BigDecimal homeWinProb,
            @NotNull BigDecimal predictedHome,
            @NotNull BigDecimal predictedAway,
            @NotNull BigDecimal homeEloPre,
            @NotNull BigDecimal awayEloPre,
            @NotNull Instant generatedAt
    ) {}

    public record IngestResult(int received, int inserted, int updated) {}
}
