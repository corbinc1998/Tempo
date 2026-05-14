package dev.tempo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures springdoc-openapi.
 *
 * Hits:
 *   /v3/api-docs      <- JSON spec
 *   /swagger-ui.html  <- interactive UI
 *
 * Why this matters:
 *   - Frontend developers can explore the API without reading source
 *   - The spec is consumable by codegen tools (you could generate the BFF's
 *     Spring API client from it instead of hand-rolling springApi.ts)
 *   - It's free documentation that stays in sync with the code
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI simLeagueOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Tempo API")
                        .description("Prediction-serving API backing the Tempo dashboard.")
                        .version("v1")
                        .contact(new Contact()
                                .name("Tempo")
                                .url("https://thetempo.web.app")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
