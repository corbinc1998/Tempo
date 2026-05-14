package dev.tempo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Application entry point.
 *
 * {@code @SpringBootApplication} is shorthand for three annotations:
 *
 *   - {@code @Configuration}      Marks this class as a source of bean definitions.
 *   - {@code @EnableAutoConfiguration} Activates Spring Boot's auto-configuration. Scans the classpath
 *                                     and configures beans based on what it finds (Postgres driver
 *                                     present -> configure DataSource, etc).
 *   - {@code @ComponentScan}      Scans this package and subpackages for {@code @Component},
 *                                {@code @Service}, {@code @Repository}, {@code @Controller}.
 *
 * Because this class lives in {@code dev.tempo}, component scanning
 * automatically finds every annotated class under that package - which is why all
 * domain code lives there.
 */
@SpringBootApplication
public class TempoApplication {

    public static void main(String[] args) {
        SpringApplication.run(TempoApplication.class, args);
    }
}
